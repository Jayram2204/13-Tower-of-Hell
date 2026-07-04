export const trapAgentABI = [
  {
    "type": "function",
    "name": "activateFloorTraps",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
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
    "name": "deactivateFloorTraps",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTrap",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "trapId",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "floor",
            "type": "uint256"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "cooldownRemaining",
            "type": "uint256"
          },
          {
            "name": "triggerCount",
            "type": "uint256"
          },
          {
            "name": "resetTimeMs",
            "type": "uint256"
          },
          {
            "name": "damage",
            "type": "uint256"
          },
          {
            "name": "pattern",
            "type": "uint8"
          },
          {
            "name": "lastTriggeredAt",
            "type": "uint256"
          },
          {
            "name": "registeredAt",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTrapCount",
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
    "name": "getTrapsOnFloor",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isTrapActive",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
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
    "name": "registerTrap",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      },
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "resetTimeMs",
        "type": "uint256"
      },
      {
        "name": "damage",
        "type": "uint256"
      },
      {
        "name": "pattern",
        "type": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "resetAll",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "resetTrap",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setActive",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      },
      {
        "name": "isActive",
        "type": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tickCooldowns",
    "inputs": [
      {
        "name": "tickMs",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
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
    "name": "trapList",
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
    "name": "traps",
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "trapId",
        "type": "string"
      },
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "isActive",
        "type": "bool"
      },
      {
        "name": "cooldownRemaining",
        "type": "uint256"
      },
      {
        "name": "triggerCount",
        "type": "uint256"
      },
      {
        "name": "resetTimeMs",
        "type": "uint256"
      },
      {
        "name": "damage",
        "type": "uint256"
      },
      {
        "name": "pattern",
        "type": "uint8"
      },
      {
        "name": "lastTriggeredAt",
        "type": "uint256"
      },
      {
        "name": "registeredAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "triggerTrap",
    "inputs": [
      {
        "name": "trapId",
        "type": "string"
      }
    ],
    "outputs": [
      {
        "name": "damage",
        "type": "uint256"
      }
    ],
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
  },
  {
    "type": "event",
    "name": "TrapActivated",
    "inputs": [
      {
        "name": "trapHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "isActive",
        "type": "bool"
      }
    ]
  },
  {
    "type": "event",
    "name": "TrapRegistered",
    "inputs": [
      {
        "name": "trapHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "trapId",
        "type": "string"
      },
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "damage",
        "type": "uint256"
      },
      {
        "name": "pattern",
        "type": "uint8"
      }
    ]
  },
  {
    "type": "event",
    "name": "TrapReset",
    "inputs": [
      {
        "name": "trapHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "TrapTriggered",
    "inputs": [
      {
        "name": "trapHash",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "damage",
        "type": "uint256"
      },
      {
        "name": "triggerCount",
        "type": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  }
] as const;
