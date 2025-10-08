//! A smart contract for managing micropayments for digital content.

use starknet::ContractAddress;

// --- INTERFACES ---

/// The main interface for the PaymentManager contract.
#[starknet::interface]
pub trait IPaymentManager<TContractState> {
    // NOTE: Ownership and Pausability functions are now directly exposed by the contract
    // through the embedded component ABIs. They are removed from this custom interface.

    // Your main business logic functions
    fn redeem_voucher(ref self: TContractState, voucher: felt252, content_id: felt252, creator: ContractAddress);
    fn get_unlocked_content(self: @TContractState, user: ContractAddress, content_id: felt252) -> bool;
    fn withdraw(ref self: TContractState, amount: u256);
    fn get_content_price(self: @TContractState, content_id: felt252) -> u256;
    fn get_creator_balance(self: @TContractState, creator: ContractAddress) -> u256;
    fn get_content_unlock_count(self: @TContractState, content_id: felt252) -> u256;
}

/// A simplified interface for an ERC20 token.
#[starknet::interface]
pub trait IERC20<TContractState> {
    /// Transfers tokens from the caller to a recipient.
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    /// Transfers tokens from a sender to a recipient, on behalf of the sender.
    fn transfer_from(
        ref self: TContractState,
        sender: ContractAddress,
        recipient: ContractAddress,
        amount: u256
    ) -> bool;
}

// --- CONTRACT IMPLEMENTATION ---

#[starknet::contract]
pub mod PaymentManager {
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::traits::TryInto;
    use core::option::OptionTrait;
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    // Declare component usage
    component!(path: openzeppelin::access::ownable::ownable::OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: openzeppelin::security::pausable::PausableComponent, storage: pausable, event: PausableEvent);

    // Embed component ABIs
    #[abi(embed_v0)]
    impl OwnableImpl = openzeppelin::access::ownable::ownable::OwnableComponent::OwnableMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl PausableImpl = openzeppelin::security::pausable::PausableComponent::PausableImpl<ContractState>;

    // Implement internal component traits
    impl OwnableInternalImpl = openzeppelin::access::ownable::ownable::OwnableComponent::InternalImpl<ContractState>;
    impl PausableInternalImpl = openzeppelin::security::pausable::PausableComponent::InternalImpl<ContractState>;

    /// The address of the STRK token contract (Placeholder).
    const STRK_TOKEN_ADDRESS: ContractAddress = 
        0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
        .try_into()
        .unwrap();

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: openzeppelin::access::ownable::ownable::OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: openzeppelin::security::pausable::PausableComponent::Storage,
        unlocked_content: Map<(ContractAddress, felt252), bool>,
        creator_balances: Map<ContractAddress, u256>,
        content_prices: Map<felt252, u256>,
        content_unlock_counts: Map<felt252, u256>,
        vouchers: Map<felt252, u256>,
        oracle_address: ContractAddress,
    }
    
    // ----------------------------------------------------
    // --- EVENTS ---
    // ----------------------------------------------------

    #[derive(Drop, starknet::Event)]  
    struct ContentUnlocked {
        user: ContractAddress,
        content_id: felt252,
        price_paid: u256,
    }
    #[derive(Drop, starknet::Event)]  
    struct Withdrawal {
        creator: ContractAddress,
        amount: u256,
        timestamp: u64,
    }
    #[derive(Drop, starknet::Event)]
    struct VoucherPurchased {
        voucher: felt252,
        price: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct BtcUnlock {
        user: ContractAddress,
        content_id: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ContentUnlocked: ContentUnlocked,
        Withdrawal: Withdrawal,
        VoucherPurchased: VoucherPurchased,
        BtcUnlock: BtcUnlock,
        #[flat]
        OwnableEvent: openzeppelin::access::ownable::ownable::OwnableComponent::Event,
        #[flat]
        PausableEvent: openzeppelin::security::pausable::PausableComponent::Event,
    }

    // ----------------------------------------------------
    // --- CONSTRUCTOR & FUNCTIONS (FIXED) ---
    // ----------------------------------------------------

    #[constructor]
    fn constructor(ref self: ContractState, owner_address: ContractAddress) {
        self.ownable.initializer(owner_address);
    }

    // --- INTERNAL FUNCTIONS ---

    /// Internal function to handle the logic of unlocking a piece of content.
    fn internal_pay_to_unlock(ref self: ContractState, user: ContractAddress, content_id: felt252, creator: ContractAddress) {
        let price = self.content_prices.read(content_id);
        assert(price > 0, 'PM: Content price not set');
        
        self.unlocked_content.write((user, content_id), true);
        let current_balance = self.creator_balances.read(creator);
        self.creator_balances.write(creator, current_balance + price);
        let current_unlocks = self.content_unlock_counts.read(content_id);
        self.content_unlock_counts.write(content_id, current_unlocks + 1);

        self.emit(
            Event::ContentUnlocked(
                ContentUnlocked { user, content_id, price_paid: price }
            )
        );
    }

    // --- EXTERNAL FUNCTIONS (IPaymentManager Implementation) ---
    
    #[abi(embed_v0)]
    impl PaymentManagerImpl of super::IPaymentManager<ContractState> {
        
        // --- Business Logic methods ---
        
        fn redeem_voucher(ref self: ContractState, voucher: felt252, content_id: felt252, creator: ContractAddress) {
            self.pausable.assert_not_paused();
            
            let user = get_caller_address();
            let price = self.vouchers.read(voucher);
            assert(price > 0, 'PM: Invalid voucher');

            let content_price = self.content_prices.read(content_id);
            assert(price == content_price, 'PM: Voucher price mismatch');

            // Consume the voucher
            self.vouchers.write(voucher, 0);

            internal_pay_to_unlock(ref self, user, content_id, creator);
        }

        fn get_unlocked_content(self: @ContractState, user: ContractAddress, content_id: felt252) -> bool {
            self.unlocked_content.read((user, content_id))
        }

        fn withdraw(ref self: ContractState, amount: u256) {
            self.pausable.assert_not_paused();
            
            let creator = get_caller_address();
            let current_balance = self.creator_balances.read(creator);
            assert(amount <= current_balance, 'PM: Insufficient balance');

            self.creator_balances.write(creator, current_balance - amount);
            
            let token_dispatcher = IERC20Dispatcher { contract_address: STRK_TOKEN_ADDRESS };
            let success = token_dispatcher.transfer(creator, amount);
            assert(success, 'PM: Withdrawal failed'); 

            self.emit(
                Event::Withdrawal(
                    Withdrawal { creator, amount, timestamp: get_block_timestamp() }
                )
            );
        }
        
        fn get_content_price(self: @ContractState, content_id: felt252) -> u256 {
            self.content_prices.read(content_id)
        }
        
        fn get_creator_balance(self: @ContractState, creator: ContractAddress) -> u256 {
            self.creator_balances.read(creator)
        }

        fn get_content_unlock_count(self: @ContractState, content_id: felt252) -> u256 {
            self.content_unlock_counts.read(content_id)
        }
    }

    // --- EXTERNAL FUNCTIONS (Custom Implementation) ---

    #[generate_trait]
    impl ExternalImpl of ExternalTrait {
        /// Sets the price of a specific piece of content. Can only be called by the owner.
        fn set_content_price(ref self: ContractState, content_id: felt252, price: u256) {
            self.ownable.assert_only_owner();
            self.content_prices.write(content_id, price);
        }

        /// Buys a voucher for a specific price.
        fn buy_voucher(ref self: ContractState, price: u256) {
            self.pausable.assert_not_paused();
            
            let user = get_caller_address();

            let token_dispatcher = IERC20Dispatcher { contract_address: STRK_TOKEN_ADDRESS };
            let success = token_dispatcher.transfer_from(user, get_contract_address(), price); 
            assert(success, 'PM: TransferFrom failed');

            let random = starknet::get_block_timestamp(); 
            let voucher: felt252 = random.into();
            self.vouchers.write(voucher, price);

            self.emit(Event::VoucherPurchased(VoucherPurchased { voucher, price }));
        }

        /// Sets the address of the oracle (e.g., Atomiq). Can only be called by the owner.
        fn set_oracle_address(ref self: ContractState, oracle_address: ContractAddress) {
            self.ownable.assert_only_owner();
            self.oracle_address.write(oracle_address);
        }

        /// Unlocks a piece of content with a BTC payment. Can only be called by the oracle (e.g., Atomiq).
        fn unlock_with_btc(ref self: ContractState, user: ContractAddress, content_id: felt252, creator: ContractAddress) {
            self.pausable.assert_not_paused();
            
            assert(get_caller_address() == self.oracle_address.read(), 'PM: Not oracle');
            internal_pay_to_unlock(ref self, user, content_id, creator);
            self.emit(Event::BtcUnlock(BtcUnlock { user, content_id }));
        }
    }
}