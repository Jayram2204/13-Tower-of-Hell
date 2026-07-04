export const heroAgentABI = [
  {
    "type": "function",
    "name": "ENEMY_KILL_RENOWN",
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
    "name": "FLOOR_CLEAR_RENOWN",
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
    "name": "awardRenown",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "reason",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "characterRegistry",
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
    "name": "evaluateQuest",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      },
      {
        "name": "questId",
        "type": "string"
      },
      {
        "name": "completed",
        "type": "bool"
      },
      {
        "name": "renownReward",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getHero",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "playerAddress",
            "type": "address"
          },
          {
            "name": "playerName",
            "type": "string"
          },
          {
            "name": "currentFloor",
            "type": "uint256"
          },
          {
            "name": "renown",
            "type": "uint256"
          },
          {
            "name": "totalFloorsCleared",
            "type": "uint256"
          },
          {
            "name": "totalDeaths",
            "type": "uint256"
          },
          {
            "name": "totalEnemiesKilled",
            "type": "uint256"
          },
          {
            "name": "lastActive",
            "type": "uint256"
          },
          {
            "name": "registeredAt",
            "type": "uint256"
          },
          {
            "name": "exists",
            "type": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getHeroQuests",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          {
            "name": "questId",
            "type": "string"
          },
          {
            "name": "completed",
            "type": "bool"
          },
          {
            "name": "completedAt",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRegisteredHeroCount",
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
    "name": "heroQuests",
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "questId",
        "type": "string"
      },
      {
        "name": "completed",
        "type": "bool"
      },
      {
        "name": "completedAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "heroes",
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "playerAddress",
        "type": "address"
      },
      {
        "name": "playerName",
        "type": "string"
      },
      {
        "name": "currentFloor",
        "type": "uint256"
      },
      {
        "name": "renown",
        "type": "uint256"
      },
      {
        "name": "totalFloorsCleared",
        "type": "uint256"
      },
      {
        "name": "totalDeaths",
        "type": "uint256"
      },
      {
        "name": "totalEnemiesKilled",
        "type": "uint256"
      },
      {
        "name": "lastActive",
        "type": "uint256"
      },
      {
        "name": "registeredAt",
        "type": "uint256"
      },
      {
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isQuestCompleted",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      },
      {
        "name": "questId",
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
    "name": "recordDeath",
    "inputs": [
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
    "name": "recordEnemyKill",
    "inputs": [
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
    "name": "recordFloorClear",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      },
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
    "name": "registerHero",
    "inputs": [
      {
        "name": "player",
        "type": "address"
      },
      {
        "name": "name",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registeredHeroes",
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
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
    "name": "EnemyKilled",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "totalKilled",
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
    "name": "FloorCleared",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "newRenown",
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
    "name": "HeroRegistered",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "timestamp",
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
  },
  {
    "type": "event",
    "name": "PlayerDeath",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "totalDeaths",
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
    "name": "QuestCompleted",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "questId",
        "type": "string"
      },
      {
        "name": "renownReward",
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
    "name": "QuestEvaluated",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true
      },
      {
        "name": "questId",
        "type": "string"
      },
      {
        "name": "completed",
        "type": "bool"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "RenownAwarded",
    "inputs": [
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
        "name": "newTotal",
        "type": "uint256"
      },
      {
        "name": "reason",
        "type": "string"
      }
    ]
  }
] as const;
