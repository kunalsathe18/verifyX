// ============================================================
// verifyX Smart Contract
// Soroban SDK 21.x  ·  Stellar CLI 25.x
// ============================================================

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Symbol,
};

// ─────────────────────────────────────────────
// Data Structures
// ─────────────────────────────────────────────

/// A product registered on-chain by a seller.
#[contracttype]
#[derive(Clone)]
pub struct Product {
    /// Auto-assigned numeric ID (1-based)
    pub id: u64,
    /// Product name, e.g. "iPhone 15 Pro"
    pub name: String,
    /// Brand name, e.g. "Apple"
    pub brand: String,
    /// Stellar address of the seller who registered this product
    pub manufacturer: Address,
}

/// Keys for persistent contract storage
#[contracttype]
pub enum DataKey {
    /// Stores a Product by its ID
    Product(u64),
    /// Running counter for auto-incrementing IDs
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
    // add_product
    //
    // Registers a new product. The `manufacturer` address
    // must sign the transaction (enforced by require_auth).
    // Returns the new product ID.
    // ─────────────────────────────────────────
    pub fn add_product(
        env: Env,
        manufacturer: Address,
        name: String,
        brand: String,
    ) -> u64 {
        // Verify the transaction was signed by `manufacturer`
        manufacturer.require_auth();

        // Read current count (0 if storage is empty)
        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ProductCount)
            .unwrap_or(0);

        let new_id: u64 = count + 1;

        // Build and store the product
        let product = Product {
            id: new_id,
            name,
            brand,
            manufacturer,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Product(new_id), &product);

        // Update the counter
        env.storage()
            .persistent()
            .set(&DataKey::ProductCount, &new_id);

        // Emit an event for off-chain listeners
        env.events().publish(
            (Symbol::new(&env, "register"),),
            new_id,
        );

        new_id
    }

    // ─────────────────────────────────────────
    // get_product
    //
    // Returns the Product for the given ID.
    // Panics with "Product not found" if it doesn't exist.
    // ─────────────────────────────────────────
    pub fn get_product(env: Env, id: u64) -> Product {
        env.storage()
            .persistent()
            .get(&DataKey::Product(id))
            .unwrap_or_else(|| panic!("Product not found"))
    }

    // ─────────────────────────────────────────
    // verify_product  (bonus)
    //
    // Returns true if the product ID exists, false otherwise.
    // ─────────────────────────────────────────
    pub fn verify_product(env: Env, id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Product(id))
    }

    // ─────────────────────────────────────────
    // get_product_count
    //
    // Returns the total number of registered products.
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
        env.mock_all_auths(); // skip real signatures in unit tests

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
    }

    #[test]
    fn test_verify_product() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VerifyXContract);
        let client = VerifyXContractClient::new(&env, &contract_id);

        let seller = Address::generate(&env);

        // ID 99 should not exist
        assert!(!client.verify_product(&99u64));

        // Register one product
        client.add_product(
            &seller,
            &String::from_str(&env, "Galaxy S24"),
            &String::from_str(&env, "Samsung"),
        );

        // ID 1 should now exist, ID 2 should not
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
