import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ClickBattleRewards = await ethers.getContractFactory(
    "ClickBattleRewards"
  );
  const clickBattleRewards = await ClickBattleRewards.deploy();

  await clickBattleRewards.waitForDeployment();
  console.log(
    "clickBattleRewards deployed to:",
    await clickBattleRewards.getAddress()
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
