// ============================================================
// Dashboard.jsx  –  live metrics
// ============================================================

import React, { useEffect, useState } from "react";
import { fetchAllProducts, computeMetrics } from "../utils/indexer";
import { getUserStats } from "../utils/auth";
import { supabaseReady } from "../utils/supabase";
import {
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Account,
  Operation,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import { CONTRACT_ID } from "../utils/contract";

const _server = new rpc.Server(
  import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org",
  { allowHttp: false }
);

async function fetchProductCount() {
  try {
    const dummy = new Account(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"
    );
    const tx = new TransactionBuilder(dummy, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: "get_product_count",
        args: [],
      }))
      .setTimeout(30)
      .build();

    const sim = await _server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) return 0;
    return Number(scValToNative(sim.result.retval));
  } catch (err) {
    console.warn("Dashboard: could not fetch product count:", err.message);
    return 0;
  }
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalProducts:  0,
    totalVerified:  0,
    registeredUsers: 0,
    sellers:        0,
    customers:      0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Run both fetches in parallel
        const [count, userStats] = await Promise.all([
          fetchProductCount(),
          getUserStats(),
        ]);

        const products = await fetchAllProducts(count);
        const productMetrics = computeMetrics(products);

        if (!cancelled) {
          setMetrics({
            totalProducts:   productMetrics.totalProducts,
            totalVerified:   productMetrics.totalVerified,
            registeredUsers: userStats.total,
            sellers:         userStats.sellers,
            customers:       userStats.customers,
          });
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Refresh when a new product is registered
    const handler = () => load();
    window.addEventListener("productRegistered", handler);
    // Refresh when a new user signs up
    window.addEventListener("userRegistered", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("productRegistered", handler);
      window.removeEventListener("userRegistered", handler);
    };
  }, []);

  const cards = [
    {
      icon:      "👥",
      label:     "Total Users",
      value:     metrics.registeredUsers,
      sub:       metrics.registeredUsers > 0
                   ? `${metrics.sellers} sellers + ${metrics.customers} customers`
                   : "Sign up to be counted",
      highlight: true,
    },
    {
      icon:  "📦",
      label: "Total Products",
      value: metrics.totalProducts,
      sub:   null,
    },
    {
      icon:  "✅",
      label: "Network Verified",
      value: metrics.totalVerified,
      sub:   null,
    },
  ];

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-title">📊 Network Dashboard</h2>
      <p className="dashboard-subtitle">
        Live metrics · Users stored in{" "}
        <span className={supabaseReady ? "db-badge supabase" : "db-badge local"}>
          {supabaseReady ? "☁️ Supabase" : "💾 Local"}
        </span>
      </p>

      <div className="dashboard-grid">
        {cards.map(({ icon, label, value, sub, highlight }) => (
          <div key={label} className={`dashboard-card${highlight ? " dashboard-card--highlight" : ""}`}>
            <span className="dashboard-icon">{icon}</span>
            <span className="dashboard-value">
              {loading ? <span className="dashboard-skeleton" /> : value}
            </span>
            <span className="dashboard-label">{label}</span>
            {sub && !loading && (
              <span className="dashboard-sub">{sub}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
