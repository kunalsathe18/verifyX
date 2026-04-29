// ============================================================
// verifyX Smart Contract
// Soroban SDK 21.x  ·  Stellar CLI 25.x
// ============================================================

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Symbol, Vec,
};

// ─────────────────────────────────────────────
// Data Structures
// ─────────────────────────────────────────────

/// A product registered on-chain by a seller.
#[contracttype]
#[derive(Clone)]
pub struct Product {
    pub id:           u64,
    pub name:         String,
    pub brand:        String,
    pub manufacturer: Address,
    /// Addresses that have approved this product (multi-sig)
    pub approvals:    Vec<Address>,
    /// True once approvals.len() >= 2
    pub is_verified:  bool,
}

/// Keys for persistent contract storage
#[contracttype]
pub enum DataKey {
    Product(u64),
    ProductCount,
}

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

#[contract]
pub struct VerifyXContract;

#[contractimpl]
impl VerifyXContract {

    // ─────────────────────────────────────────
    // add_product  (unchanged behaviour)
    // ─────────────────────────────────────────
    pub fn add_product(
        env: Env,
        manufacturer: Address,
        name: String,
        brand: String,
    ) -> u64 {
        manufacturer.require_auth();

        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ProductCount)
            .unwrap_or(0);

        let new_id: u64 = count + 1;

        let product = Product {
            id:           new_id,
            name,
            brand,
            manufacturer,
            approvals:    Vec::new(&env),   // NEW – starts empty
            is_verified:  false,            // NEW – starts unverified
        };

        env.storage()
            .persistent()
            .set(&DataKey::Product(new_id), &product);

        env.storage()
            .persistent()
            .set(&DataKey::ProductCount, &new_id);

        env.events().publish(
            (Symbol::new(&env, "register"),),
            new_id,
        );

        new_id
    }

    // ─────────────────────────────────────────
    // approve_product  (NEW)
    //
    // Any wallet can approve a product once.
    // When approvals reach 2 the product is marked verified.
    // ─────────────────────────────────────────
    pub fn approve_product(env: Env, approver: Address, product_id: u64) {
        approver.require_auth();

        let mut product: Product = env
            .storage()
            .persistent()
            .get(&DataKey::Product(product_id))
            .unwrap_or_else(|| panic!("Product not found"));

        // Prevent duplicate approvals from the same address
        for existing in product.approvals.iter() {
            if existing == approver {
                panic!("Already approved");
            }
        }

        product.approvals.push_back(approver.clone());

        // Auto-verify once 2 or more approvals collected
        if product.approvals.len() >= 2 {
            product.is_verified = true;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Product(product_id), &product);

        env.events().publish(
            (Symbol::new(&env, "approve"),),
            product_id,
        );
    }

    // ─────────────────────────────────────────
    // get_product  (unchanged – returns full struct)
    // ─────────────────────────────────────────
    pub fn get_product(env: Env, id: u64) -> Product {
        env.storage()
            .persistent()
            .get(&DataKey::Product(id))
            .unwrap_or_else(|| panic!("Product not found"))
    }

    // ─────────────────────────────────────────
    // verify_product  (unchanged)
    // ─────────────────────────────────────────
    pub fn verify_product(env: Env, id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Product(id))
    }

    // ─────────────────────────────────────────
    // get_product_count  (unchanged)
    // ─────────────────────────────────────────
    pub fn get_product_count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::ProductCount)
            .unwrap_or(0)
    }
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_add_and_get_product() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller = Address::generate(&env);

        let id = client.add_product(
            &seller,
            &String::from_str(&env, "iPhone 15 Pro"),
            &String::from_str(&env, "Apple"),
        );
        assert_eq!(id, 1);

        let product = client.get_product(&1u64);
        assert_eq!(product.id, 1);
        assert_eq!(product.manufacturer, seller);
        assert_eq!(product.approvals.len(), 0);
        assert!(!product.is_verified);
    }

    #[test]
    fn test_approve_product() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller   = Address::generate(&env);
        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);

        client.add_product(
            &seller,
            &String::from_str(&env, "Galaxy S24"),
            &String::from_str(&env, "Samsung"),
        );

        // One approval — not yet verified
        client.approve_product(&approver1, &1u64);
        let p = client.get_product(&1u64);
        assert_eq!(p.approvals.len(), 1);
        assert!(!p.is_verified);

        // Second approval — now verified
        client.approve_product(&approver2, &1u64);
        let p2 = client.get_product(&1u64);
        assert_eq!(p2.approvals.len(), 2);
        assert!(p2.is_verified);
    }

    #[test]
    #[should_panic(expected = "Already approved")]
    fn test_duplicate_approval_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller   = Address::generate(&env);
        let approver = Address::generate(&env);

        client.add_product(
            &seller,
            &String::from_str(&env, "PS5"),
            &String::from_str(&env, "Sony"),
        );

        client.approve_product(&approver, &1u64);
        client.approve_product(&approver, &1u64); // should panic
    }

    #[test]
    fn test_verify_product() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller = Address::generate(&env);
        assert!(!client.verify_product(&99u64));

        client.add_product(
            &seller,
            &String::from_str(&env, "Galaxy S24"),
            &String::from_str(&env, "Samsung"),
        );

        assert!(client.verify_product(&1u64));
        assert!(!client.verify_product(&2u64));
    }

    #[test]
    fn test_product_count() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller = Address::generate(&env);
        assert_eq!(client.get_product_count(), 0);

        client.add_product(
            &seller,
            &String::from_str(&env, "PS5"),
            &String::from_str(&env, "Sony"),
        );
        assert_eq!(client.get_product_count(), 1);

        client.add_product(
            &seller,
            &String::from_str(&env, "Xbox Series X"),
            &String::from_str(&env, "Microsoft"),
        );
        assert_eq!(client.get_product_count(), 2);
    }
}
