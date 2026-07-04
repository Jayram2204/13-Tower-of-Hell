export const agentRegistryABI = [
  {
    "type": "function",
    "name": "addAgentAdmin",
    "inputs": [
      {
        "name": "admin",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "agentAdmins",
    "inputs": [
      {
        "name": "",
        "type": "address"
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
    "name": "agentCount",
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
    "name": "agents",
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "agentType",
        "type": "uint8"
      },
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "adminAddress",
        "type": "address"
      },
      {
        "name": "status",
        "type": "uint8"
      },
      {
        "name": "lastHeartbeat",
        "type": "uint256"
      },
      {
        "name": "registeredAt",
        "type": "uint256"
      },
      {
        "name": "metadataUri",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgent",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "agentId",
            "type": "bytes32"
          },
          {
            "name": "agentType",
            "type": "uint8"
          },
          {
            "name": "contractAddress",
            "type": "address"
          },
          {
            "name": "adminAddress",
            "type": "address"
          },
          {
            "name": "status",
            "type": "uint8"
          },
          {
            "name": "lastHeartbeat",
            "type": "uint256"
          },
          {
            "name": "registeredAt",
            "type": "uint256"
          },
          {
            "name": "metadataUri",
            "type": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgentContract",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
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
    "name": "heartbeat",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "status",
        "type": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isAgentHealthy",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "timeout",
        "type": "uint256"
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
    "name": "registerAgent",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "agentType",
        "type": "uint8"
      },
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "adminAddress",
        "type": "address"
      },
      {
        "name": "metadataUri",
        "type": "bytes32"
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
    "name": "removeAgentAdmin",
    "inputs": [
      {
        "name": "admin",
        "type": "address"
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
    "name": "updateAgentContract",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "newContract",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AgentAdminAdded",
    "inputs": [
      {
        "name": "admin",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentAdminRemoved",
    "inputs": [
      {
        "name": "admin",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentContractUpdated",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "newContract",
        "type": "address"
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentHeartbeat",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "status",
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
    "name": "AgentRegistered",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "agentType",
        "type": "uint8",
        "indexed": true
      },
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "adminAddress",
        "type": "address"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentStatusChanged",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "oldStatus",
        "type": "uint8"
      },
      {
        "name": "newStatus",
        "type": "uint8"
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
