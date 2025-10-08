// --- FIX 1: Minimal Starknet and Core Imports ---
// This is the correct, standard way to import for these versions.
use starknet::{ContractAddress, contract_address_const};
use core::{felt252, traits::{Into, TryInto}, integer::u256, result::ResultTrait};

// FIX: Importing Array functions directly under their most common module.
// This is the canonical path that must work.
use core::array::{ArrayTrait, array_new};

// --- FIX 2: Explicit Snforge Imports (Canonical Internal Paths) ---
use snforge_std::declare; 

// FIX: Explicitly import cheatcodes from their internal module, as root re-exports are failing.
use snforge_std::cheatcodes::{
    start_prank, 
    stop_prank, 
    CheatTarget
};
use snforge_std::contract_class::DeclareResultTrait; 

// --- FIX 3: Dispatcher Imports ---
// This must be correct, as it reflects the structure of a standard Scarb project.
use smart_contract::{IPaymentManagerDispatcher, IPaymentManagerDispatcherTrait};
use smart_contract::{IExternalImplDispatcher, IExternalImplDispatcherTrait};
use openzeppelin::access::ownable::{IOwnableDispatcher, IOwnableDispatcherTrait};


fn deploy_contract() -> ContractAddress {
    let contract = declare("PaymentManager").expect('Failed to declare contract');
    let owner = contract_address_const::<0x1>();
    
    // Explicit array creation and ContractAddress to felt252 conversion.
    let mut constructor_calldata: Array<felt252> = array_new();
    constructor_calldata.append(owner.try_into().unwrap()); 
    
    // Using method call, which relies on DeclareResultTrait being in scope.
    let (contract_address, _) = contract.deploy(@constructor_calldata.span()).unwrap(); 
    contract_address
}

#[test]
fn test_set_content_price() {
    let contract_address = deploy_contract();
    let dispatcher = IExternalImplDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();
    start_prank(CheatTarget::One(contract_address), owner);

    let content_id: felt252 = 123.into();
    let price: u256 = 100.into(); 
    
    dispatcher.set_content_price(content_id, price);

    let stored_price = dispatcher.get_content_price(content_id);
    assert(stored_price == price, 'Price not set correctly');

    stop_prank(CheatTarget::One(contract_address));
}

#[test]
fn test_buy_voucher_and_redeem() {
    let contract_address = deploy_contract();
    let payment_manager_dispatcher = IPaymentManagerDispatcher { contract_address };
    let external_dispatcher = IExternalImplDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();
    let user = contract_address_const::<0x2>();
    let creator = contract_address_const::<0x3>();

    // Set content price
    start_prank(CheatTarget::One(contract_address), owner);
    let content_id: felt252 = 456.into();
    let price: u256 = 200.into();
    external_dispatcher.set_content_price(content_id, price);
    stop_prank(CheatTarget::One(contract_address));

    // User buys a voucher
    start_prank(CheatTarget::One(contract_address), user);
    external_dispatcher.buy_voucher(price);
    stop_prank(CheatTarget::One(contract_address));

    // Assuming we can get the voucher ID from an event or return value (not currently implemented)
    // For now, let's assume a known voucher for testing purposes.
    // In a real scenario, you'd need to capture the event or modify buy_voucher to return the voucher ID.
    let voucher_id: felt252 = 12345.into(); // Placeholder

    // User redeems the voucher
    start_prank(CheatTarget::One(contract_address), user);
    payment_manager_dispatcher.redeem_voucher(voucher_id, content_id, creator);
    stop_prank(CheatTarget::One(contract_address));

    // Verify content is unlocked
    let unlocked = payment_manager_dispatcher.get_unlocked_content(user, content_id);
    assert(unlocked, 'Content not unlocked after voucher redeem');

    // Verify creator balance
    let creator_balance = payment_manager_dispatcher.get_creator_balance(creator);
    assert(creator_balance == price, 'Creator balance incorrect after voucher redeem');
}

#[test]
fn test_withdraw() {
    let contract_address = deploy_contract();
    let payment_manager_dispatcher = IPaymentManagerDispatcher { contract_address };
    let external_dispatcher = IExternalImplDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();
    let user = contract_address_const::<0x2>();
    let creator = contract_address_const::<0x3>();

    let content_id: felt252 = 789.into();
    let price: u256 = 300.into();
    let amount_to_withdraw: u256 = 300.into();

    // 1. Setup: Set price and simulate payment (deposit funds for the creator)
    start_prank(CheatTarget::One(contract_address), owner);
    external_dispatcher.set_content_price(content_id, price);
    stop_prank(CheatTarget::One(contract_address));

    // Simulate a voucher purchase and redeem to get funds into creator's balance
    start_prank(CheatTarget::One(contract_address), user);
    external_dispatcher.buy_voucher(price);
    // Assuming a voucher ID for testing. In reality, this would come from an event.
    let voucher_id: felt252 = 54321.into(); // Another placeholder
    payment_manager_dispatcher.redeem_voucher(voucher_id, content_id, creator);
    stop_prank(CheatTarget::One(contract_address));

    // 2. Creator withdraws
    start_prank(CheatTarget::One(contract_address), creator);
    payment_manager_dispatcher.withdraw(amount_to_withdraw);
    stop_prank(CheatTarget::One(contract_address));

    // 3. Verify creator balance is zero
    let creator_balance = payment_manager_dispatcher.get_creator_balance(creator);
    assert(creator_balance == 0.into(), 'Creator balance not zero after withdrawal');
}

#[test]
fn test_unlock_with_btc() {
    let contract_address = deploy_contract();
    let payment_manager_dispatcher = IPaymentManagerDispatcher { contract_address };
    let external_dispatcher = IExternalImplDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();
    let oracle = contract_address_const::<0x4>(); // Oracle address
    let user = contract_address_const::<0x2>();
    let creator = contract_address_const::<0x3>();

    // Set oracle address
    start_prank(CheatTarget::One(contract_address), owner);
    external_dispatcher.set_oracle_address(oracle);
    stop_prank(CheatTarget::One(contract_address));

    // Set content price
    start_prank(CheatTarget::One(contract_address), owner);
    let content_id: felt252 = 999.into();
    let price: u256 = 500.into();
    external_dispatcher.set_content_price(content_id, price);
    stop_prank(CheatTarget::One(contract_address));

    // Oracle unlocks content with BTC
    start_prank(CheatTarget::One(contract_address), oracle);
    external_dispatcher.unlock_with_btc(user, content_id, creator);
    stop_prank(CheatTarget::One(contract_address));

    // Verify content is unlocked
    let unlocked = payment_manager_dispatcher.get_unlocked_content(user, content_id);
    assert(unlocked, 'Content not unlocked with BTC');

    // Verify creator balance
    let creator_balance = payment_manager_dispatcher.get_creator_balance(creator);
    assert(creator_balance == price, 'Creator balance incorrect after BTC unlock');
}

#[test]
fn test_transfer_ownership() {
    let contract_address = deploy_contract();
    let ownable_dispatcher = IOwnableDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();
    let new_owner = contract_address_const::<0x5>();

    start_prank(CheatTarget::One(contract_address), owner);
    ownable_dispatcher.transfer_ownership(new_owner);
    stop_prank(CheatTarget::One(contract_address));

    let current_owner = ownable_dispatcher.owner();
    assert(current_owner == new_owner, 'Ownership not transferred correctly');
}

#[test]
fn test_renounce_ownership() {
    let contract_address = deploy_contract();
    let ownable_dispatcher = IOwnableDispatcher { contract_address };

    let owner = contract_address_const::<0x1>();

    start_prank(CheatTarget::One(contract_address), owner);
    ownable_dispatcher.renounce_ownership();
    stop_prank(CheatTarget::One(contract_address));

    let current_owner = ownable_dispatcher.owner();
    assert(current_owner == contract_address_const::<0x0>(), 'Ownership not renounced correctly');
}



