export const dungeonProgressABI = [
  {
    type: "event",
    name: "FloorCleared",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "floorId", type: "bytes32" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "BountyClaimed",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "floorId", type: "bytes32" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ServerSignerUpdated",
    inputs: [
      { indexed: true, name: "oldSigner", type: "address" },
      { indexed: true, name: "newSigner", type: "address" },
    ],
  },
  {
    inputs: [
      { name: "wallet", type: "address" },
      { name: "floorId", type: "string" },
    ],
    name: "getFloorProgress",
    outputs: [
      { name: "clearedAt", type: "uint256" },
      { name: "bountyClaimed", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "wallet", type: "address" }],
    name: "getTotalFloorsCleared",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "wallet", type: "address" }],
    name: "getTotalBountyClaimed",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "floorBounties",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "floorId", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    name: "clearFloor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "floorId", type: "string" }],
    name: "claimBounty",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;
