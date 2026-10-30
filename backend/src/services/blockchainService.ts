import { ethers } from "ethers";
import { config } from "../config";

export interface BlockchainResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  status: "CONFIRMED" | "PENDING" | "OFFLINE";
  error?: string;
}

export interface VerificationResult {
  isAvailable: boolean;
  matchesOnChain: boolean;
  onChainHash?: string;
  recorder?: string;
  timestamp?: number;
  blockNumber?: number;
  error?: string;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string = "";
  private contractAbi: any[] = [];

  constructor() {
    this.init();
  }

  public init() {
    try {
      this.contractAddress = config.contractAddress;
      this.contractAbi = config.contractAbi;

      if (!this.contractAddress || !this.contractAbi || this.contractAbi.length === 0) {
        console.warn("[BlockchainService] Contract ABI or address not configured yet.");
        return;
      }

      const network = ethers.Network.from({ name: "localhost", chainId: 31337 });
      this.provider = new ethers.JsonRpcProvider(config.blockchainRpcUrl, network, {
        staticNetwork: network,
      });
      this.wallet = new ethers.Wallet(config.blockchainPrivateKey, this.provider);
      this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.wallet);
    } catch (err: any) {
      console.warn("[BlockchainService] Initialization notice:", err.message);
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      if (!this.provider) {
        this.init();
      }
      if (!this.provider) return false;
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register a new raw material batch on-chain
   */
  public async registerBatch(
    batchId: string,
    materialCategory: string,
    materialName: string,
    supplierAddress: string,
    quantity: number,
    unit: string,
    initialEventHash: string
  ): Promise<BlockchainResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return { success: false, status: "OFFLINE", error: "Blockchain node unreachable or contract not configured" };
      }

      // Valid ethereum address or fallback to wallet address
      const validSupplier = ethers.isAddress(supplierAddress)
        ? supplierAddress
        : await this.wallet!.getAddress();

      // Ensure hash is bytes32
      const hashBytes32 = initialEventHash.startsWith("0x")
        ? initialEventHash
        : "0x" + initialEventHash;

      const roundedQuantity = Math.max(1, Math.round(quantity));

      const tx = await this.contract.registerBatch(
        batchId,
        materialCategory,
        materialName,
        validSupplier,
        roundedQuantity,
        unit,
        hashBytes32
      );

      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "CONFIRMED",
      };
    } catch (err: any) {
      console.error("[BlockchainService] registerBatch error:", err.message);
      return {
        success: false,
        status: "OFFLINE",
        error: err.reason || err.message,
      };
    }
  }

  /**
   * Record a traceability event hash on-chain
   */
  public async recordEvent(
    batchId: string,
    eventId: string,
    eventType: string,
    eventHash: string,
    prevEventHash: string
  ): Promise<BlockchainResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return { success: false, status: "OFFLINE", error: "Blockchain node unreachable" };
      }

      const eventHashBytes32 = eventHash.startsWith("0x") ? eventHash : "0x" + eventHash;
      const prevHashBytes32 =
        prevEventHash && prevEventHash !== "0x0"
          ? prevEventHash.startsWith("0x")
            ? prevEventHash
            : "0x" + prevEventHash
          : ethers.ZeroHash;

      const tx = await this.contract.recordEvent(
        batchId,
        eventId,
        eventType,
        eventHashBytes32,
        prevHashBytes32
      );

      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "CONFIRMED",
      };
    } catch (err: any) {
      console.error("[BlockchainService] recordEvent error:", err.message);
      return {
        success: false,
        status: "OFFLINE",
        error: err.reason || err.message,
      };
    }
  }

  /**
   * Anchor a sustainability document hash on-chain
   */
  public async anchorDocumentHash(
    batchId: string,
    documentHash: string,
    description: string
  ): Promise<BlockchainResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return { success: false, status: "OFFLINE", error: "Blockchain node unreachable" };
      }

      const docHashBytes32 = documentHash.startsWith("0x")
        ? documentHash
        : "0x" + documentHash;

      const tx = await this.contract.anchorDocumentHash(batchId, docHashBytes32, description);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "CONFIRMED",
      };
    } catch (err: any) {
      console.error("[BlockchainService] anchorDocumentHash error:", err.message);
      return {
        success: false,
        status: "OFFLINE",
        error: err.reason || err.message,
      };
    }
  }

  /**
   * Record custody transfer on-chain
   */
  public async transferCustody(
    batchId: string,
    newCustodianAddress: string
  ): Promise<BlockchainResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return { success: false, status: "OFFLINE", error: "Blockchain node unreachable" };
      }

      const validAddress = ethers.isAddress(newCustodianAddress)
        ? newCustodianAddress
        : await this.wallet!.getAddress();

      const tx = await this.contract.transferCustody(batchId, validAddress);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "CONFIRMED",
      };
    } catch (err: any) {
      console.error("[BlockchainService] transferCustody error:", err.message);
      return {
        success: false,
        status: "OFFLINE",
        error: err.reason || err.message,
      };
    }
  }

  /**
   * Record genealogy split or merge link on-chain
   */
  public async recordGenealogy(
    parentBatchId: string,
    childBatchId: string,
    operationType: "SPLIT" | "MERGE"
  ): Promise<BlockchainResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return { success: false, status: "OFFLINE", error: "Blockchain node unreachable" };
      }

      const tx = await this.contract.recordGenealogy(parentBatchId, childBatchId, operationType);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: "CONFIRMED",
      };
    } catch (err: any) {
      console.error("[BlockchainService] recordGenealogy error:", err.message);
      return {
        success: false,
        status: "OFFLINE",
        error: err.reason || err.message,
      };
    }
  }

  /**
   * Verify an event hash against on-chain anchor
   */
  public async verifyEventHash(
    batchId: string,
    eventIndex: number,
    expectedHash: string
  ): Promise<VerificationResult> {
    try {
      if (!(await this.isAvailable()) || !this.contract) {
        return {
          isAvailable: false,
          matchesOnChain: false,
          error: "Blockchain node unreachable or contract not configured",
        };
      }

      const hashBytes32 = expectedHash.startsWith("0x") ? expectedHash : "0x" + expectedHash;
      const res = await this.contract.verifyEventHash(batchId, eventIndex, hashBytes32);

      const isValid: boolean = res[0];
      const onChainHash: string = res[1];
      const recorder: string = res[2];
      const timestamp: number = Number(res[3]);

      return {
        isAvailable: true,
        matchesOnChain: isValid,
        onChainHash,
        recorder,
        timestamp,
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        matchesOnChain: false,
        error: err.message,
      };
    }
  }

  /**
   * Fetch transaction details by transaction hash
   */
  public async getTransactionDetails(txHash: string) {
    try {
      if (!(await this.isAvailable()) || !this.provider) {
        return null;
      }
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!tx || !receipt) return null;

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: tx.from,
        to: tx.to,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "SUCCESS" : "REVERTED",
        confirmations: await tx.confirmations(),
      };
    } catch (err: any) {
      console.error("[BlockchainService] getTransactionDetails error:", err.message);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
