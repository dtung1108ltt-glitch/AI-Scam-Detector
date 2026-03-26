from blockchain.polygon_client import w3

# replace with your deployed contract address (checksum format)
contract_address: str = w3.toChecksumAddress("0xYOUR_CONTRACT")

abi = [...]  

contract = w3.eth.contract(
    address=contract_address,
    abi=abi  # type: ignore
)  # type: ignore

def is_blacklisted(addr):

    return contract.functions.isBlacklisted(addr).call()