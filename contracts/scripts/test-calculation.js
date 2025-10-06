const { ethers } = require("ethers");

function testCalculation() {
  console.log("🧮 Testing ETH to USDT calculation...");
  
  // Test values
  const ethAmount = ethers.utils.parseEther("0.00001"); // 0.00001 ETH in wei
  const ethPrice = ethers.BigNumber.from("2000").mul(ethers.BigNumber.from("10").pow(6)); // $2000 in USDT units (6 decimals)
  
  console.log("Input values:");
  console.log("  ETH amount:", ethers.utils.formatEther(ethAmount), "ETH");
  console.log("  ETH price:", ethers.utils.formatUnits(ethPrice, 6), "USDT per ETH");
  
  // Current calculation (what the contract does)
  const currentCalculation = ethAmount.mul(ethPrice).div(ethers.utils.parseEther("1"));
  console.log("\nCurrent calculation (contract):");
  console.log("  (msg.value * ethPrice) / 1e18");
  console.log("  Result:", ethers.utils.formatUnits(currentCalculation, 6), "USDT");
  
  // Correct calculation
  // ETH amount in wei * price in USDT units / 1e18 = USDT amount
  const correctCalculation = ethAmount.mul(ethPrice).div(ethers.BigNumber.from("10").pow(18));
  console.log("\nCorrect calculation:");
  console.log("  (ethAmount * ethPrice) / 1e18");
  console.log("  Result:", ethers.utils.formatUnits(correctCalculation, 6), "USDT");
  
  // Expected result for 0.00001 ETH at $2000
  const expected = ethers.BigNumber.from("2000").mul(ethers.BigNumber.from("10").pow(6)).div(ethers.BigNumber.from("10").pow(5));
  console.log("\nExpected result:");
  console.log("  0.00001 ETH * $2000 = $0.02");
  console.log("  In USDT units:", ethers.utils.formatUnits(expected, 6), "USDT");
  
  // 70% LTV
  const loanAmount = correctCalculation.mul(70).div(100);
  console.log("\nLoan amount (70% LTV):");
  console.log("  Result:", ethers.utils.formatUnits(loanAmount, 6), "USDT");
}

testCalculation();
