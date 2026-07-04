export const workerAgentABI = [
  {
    "type": "function",
    "name": "MIN_TICK_INTERVAL",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PRICE_MODIFIER_DELTA",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PRICE_MODIFIER_MAX",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "PRICE_MODIFIER_MIN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "agentAdmin",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "economicStates",
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "credits",
        "type": "uint256"
      },
      {
        "name": "priceModifier",
        "type": "uint256"
      },
      {
        "name": "inventoryValue",
        "type": "uint256"
      },
      {
        "name": "supply",
        "type": "uint256"
      },
      {
        "name": "demand",
        "type": "uint256"
      },
      {
        "name": "lastTick",
        "type": "uint256"
      },
      {
        "name": "tickCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEconomicState",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "npcId",
            "type": "string"
          },
          {
            "name": "credits",
            "type": "uint256"
          },
          {
            "name": "priceModifier",
            "type": "uint256"
          },
          {
            "name": "inventoryValue",
            "type": "uint256"
          },
          {
            "name": "supply",
            "type": "uint256"
          },
          {
            "name": "demand",
            "type": "uint256"
          },
          {
            "name": "lastTick",
            "type": "uint256"
          },
          {
            "name": "tickCount",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTrackedNpcCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "npcRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerNpcEconomy",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "initialCredits",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "runEconomyTick",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "currentSupply",
        "type": "uint256"
      },
      {
        "name": "currentDemand",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "newPriceModifier",
        "type": "uint256"
      },
      {
        "name": "newCredits",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setCredits",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "credits",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPriceModifier",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "newModifier",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settleMicrotransaction",
    "inputs": [
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "player",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "itemId",
        "type": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "trackedNpcs",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateAgentAdmin",
    "inputs": [
      {
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "EconomyTick",
    "inputs": [
      {
        "name": "npcHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "supply",
        "type": "uint256"
      },
      {
        "name": "demand",
        "type": "uint256"
      },
      {
        "name": "newPriceModifier",
        "type": "uint256"
      },
      {
        "name": "newCredits",
        "type": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "NPCCreditsSettled",
    "inputs": [
      {
        "name": "npcHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "itemId",
        "type": "string"
      }
    ]
  },
  {
    "type": "event",
    "name": "NPCEconomicRegistered",
    "inputs": [
      {
        "name": "npcHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "npcId",
        "type": "string"
      },
      {
        "name": "initialCredits",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true
      }
    ]
  }
] as const;
