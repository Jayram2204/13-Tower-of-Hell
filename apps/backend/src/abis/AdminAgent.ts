export const adminAgentABI = [
  {
    "type": "function",
    "name": "activePlayerCount",
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
    "name": "adjustGlobalDifficulty",
    "inputs": [
      {
        "name": "delta",
        "type": "int256"
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
    "name": "canAccessFloor",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "playerRenown",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "allowed",
        "type": "bool"
      },
      {
        "name": "reason",
        "type": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "floors",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "isUnlocked",
        "type": "bool"
      },
      {
        "name": "difficultyTier",
        "type": "uint256"
      },
      {
        "name": "minRenown",
        "type": "uint256"
      },
      {
        "name": "requiredClears",
        "type": "uint256"
      },
      {
        "name": "currentClears",
        "type": "uint256"
      },
      {
        "name": "state",
        "type": "uint8"
      },
      {
        "name": "lastTransition",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllFloors",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[14]",
        "components": [
          {
            "name": "floor",
            "type": "uint256"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "isUnlocked",
            "type": "bool"
          },
          {
            "name": "difficultyTier",
            "type": "uint256"
          },
          {
            "name": "minRenown",
            "type": "uint256"
          },
          {
            "name": "requiredClears",
            "type": "uint256"
          },
          {
            "name": "currentClears",
            "type": "uint256"
          },
          {
            "name": "state",
            "type": "uint8"
          },
          {
            "name": "lastTransition",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFloor",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "floor",
            "type": "uint256"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "isUnlocked",
            "type": "bool"
          },
          {
            "name": "difficultyTier",
            "type": "uint256"
          },
          {
            "name": "minRenown",
            "type": "uint256"
          },
          {
            "name": "requiredClears",
            "type": "uint256"
          },
          {
            "name": "currentClears",
            "type": "uint256"
          },
          {
            "name": "state",
            "type": "uint8"
          },
          {
            "name": "lastTransition",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "globalDifficultyOffset",
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
    "name": "resetTower",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setActivePlayerCount",
    "inputs": [
      {
        "name": "count",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFloorTier",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "tier",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalClears",
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
    "name": "transitionFloor",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "player",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unlockFloor",
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
    "name": "DifficultyTierSet",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "tier",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "FloorStateChanged",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "oldState",
        "type": "uint8"
      },
      {
        "name": "newState",
        "type": "uint8"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "FloorUnlocked",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256",
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
    "name": "GlobalDifficultyAdjusted",
    "inputs": [
      {
        "name": "oldOffset",
        "type": "uint256"
      },
      {
        "name": "newOffset",
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
