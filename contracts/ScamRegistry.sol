// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScamRegistry {

    struct Report {
        address reporter;
        string reason;
        uint severity;
    }

    mapping(address => Report[]) public reports;

    mapping(address => bool) public blacklist;

    function reportAddress(
        address target,
        string memory reason,
        uint severity
    ) public {

        reports[target].push(
            Report(msg.sender, reason, severity)
        );

        if(reports[target].length >= 10){

            blacklist[target] = true;
        }
    }

    function isBlacklisted(address target)
        public
        view
        returns(bool)
    {
        return blacklist[target];
    }
}