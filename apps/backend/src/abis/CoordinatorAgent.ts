export const coordinatorAgentABI = [
  {
    "type": "function",
    "name": "HEARTBEAT_TIMEOUT",
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
    "name": "agentRegistry",
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
    "name": "agentRoutes",
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
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "agentType",
        "type": "string"
      },
      {
        "name": "isActive",
        "type": "bool"
      },
      {
        "name": "lastHeartbeat",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "broadcastToType",
    "inputs": [
      {
        "name": "fromAgent",
        "type": "bytes32"
      },
      {
        "name": "agentType",
        "type": "string"
      },
      {
        "name": "messageType",
        "type": "string"
      },
      {
        "name": "data",
        "type": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkHeartbeats",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deregisterAgent",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAgentRoute",
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
            "name": "contractAddress",
            "type": "address"
          },
          {
            "name": "agentType",
            "type": "string"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "lastHeartbeat",
            "type": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgentsByType",
    "inputs": [
      {
        "name": "agentType",
        "type": "string"
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
    "name": "getRegisteredAgentCount",
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
    "name": "recordHeartbeat",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerAgentRoute",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32"
      },
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "agentType",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registeredAgents",
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
    "name": "routeMessage",
    "inputs": [
      {
        "name": "fromAgent",
        "type": "bytes32"
      },
      {
        "name": "toAgent",
        "type": "bytes32"
      },
      {
        "name": "messageType",
        "type": "string"
      },
      {
        "name": "data",
        "type": "bytes"
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
    "name": "routesByType",
    "inputs": [
      {
        "name": "",
        "type": "string"
      },
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
    "name": "totalRoutedMessages",
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
    "name": "AgentDeregistered",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentRegisteredRoute",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "agentType",
        "type": "string"
      }
    ]
  },
  {
    "type": "event",
    "name": "AgentRouted",
    "inputs": [
      {
        "name": "fromAgent",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "toAgent",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "messageType",
        "type": "string"
      },
      {
        "name": "data",
        "type": "bytes"
      },
      {
        "name": "timestamp",
        "type": "uint256"
      }
    ]
  },
  {
    "type": "event",
    "name": "HeartbeatTimeout",
    "inputs": [
      {
        "name": "agentId",
        "type": "bytes32",
        "indexed": true
      },
      {
        "name": "lastHeartbeat",
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
  }
] as const;
