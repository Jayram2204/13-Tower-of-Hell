export const enemyAgentABI = [
  {
    "type": "function",
    "name": "AGGRO_COOLDOWN",
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
    "name": "DIFFICULTY_DELTA",
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
    "name": "aggroState",
    "inputs": [],
    "outputs": [
      {
        "name": "cooldownUntil",
        "type": "uint256"
      },
      {
        "name": "activeCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "currentFloor",
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
    "name": "difficultyConfigs",
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
        "name": "baseHpMultiplier",
        "type": "uint256"
      },
      {
        "name": "baseDamageMultiplier",
        "type": "uint256"
      },
      {
        "name": "spawnRateMultiplier",
        "type": "uint256"
      },
      {
        "name": "aggroRangeMultiplier",
        "type": "uint256"
      },
      {
        "name": "enemyCount",
        "type": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDifficultyForFloor",
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
            "name": "baseHpMultiplier",
            "type": "uint256"
          },
          {
            "name": "baseDamageMultiplier",
            "type": "uint256"
          },
          {
            "name": "spawnRateMultiplier",
            "type": "uint256"
          },
          {
            "name": "aggroRangeMultiplier",
            "type": "uint256"
          },
          {
            "name": "enemyCount",
            "type": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFloorCount",
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
    "name": "getSpawnRecommendation",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "enemyCount",
        "type": "uint256"
      },
      {
        "name": "hpMult",
        "type": "uint256"
      },
      {
        "name": "dmgMult",
        "type": "uint256"
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
    "name": "playerHighestFloor",
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
    "name": "setActiveEnemyCount",
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
    "name": "setDifficultyConfig",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256"
      },
      {
        "name": "baseHpMultiplier",
        "type": "uint256"
      },
      {
        "name": "baseDamageMultiplier",
        "type": "uint256"
      },
      {
        "name": "spawnRateMultiplier",
        "type": "uint256"
      },
      {
        "name": "aggroRangeMultiplier",
        "type": "uint256"
      },
      {
        "name": "enemyCount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDifficultyConfigsBatch",
    "inputs": [
      {
        "name": "floors",
        "type": "uint256[]"
      },
      {
        "name": "hpMults",
        "type": "uint256[]"
      },
      {
        "name": "dmgMults",
        "type": "uint256[]"
      },
      {
        "name": "spawnMults",
        "type": "uint256[]"
      },
      {
        "name": "aggroMults",
        "type": "uint256[]"
      },
      {
        "name": "counts",
        "type": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "shouldGroupAggro",
    "inputs": [],
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
    "name": "triggerGroupAggro",
    "inputs": [],
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
    "type": "function",
    "name": "updatePlayerFloor",
    "inputs": [
      {
        "name": "newFloor",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DifficultyConfigUpdated",
    "inputs": [
      {
        "name": "floor",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "hpMult",
        "type": "uint256"
      },
      {
        "name": "dmgMult",
        "type": "uint256"
      },
      {
        "name": "spawnMult",
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
    "name": "GlobalDifficultyOffsetChanged",
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
    "name": "GroupAggroTriggered",
    "inputs": [
      {
        "name": "cooldownUntil",
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
    "name": "PlayerFloorUpdated",
    "inputs": [
      {
        "name": "currentFloor",
        "type": "uint256"
      },
      {
        "name": "highestFloor",
        "type": "uint256"
      }
    ]
  }
] as const;
