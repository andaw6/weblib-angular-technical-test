import { Injectable } from '@angular/core';
import {
  Server,
  ServerStatus,
  ServerType,
  LicenseType,
  HardwareType,
  AssetType,
  SERVER_STATUSES,
  SERVER_TYPES,
  LICENSE_TYPES,
  HARDWARE_TYPES,
  ASSET_TYPES
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly names = [
    'Apollo', 'Zeus', 'Athena', 'Hermes', 'Poseidon',
    'Artemis', 'Ares', 'Hera', 'Demeter', 'Hades',
    'Prometheus', 'Atlas', 'Chronos', 'Helios', 'Selene'
  ];

  private readonly versions = [
    '1.0.0', '1.1.0', '1.2.3', '2.0.0', '2.1.0',
    '3.0.0-beta', '3.1.2', '4.0.0', '4.1.0', '5.0.0'
  ];

  /**
   * Generate mock server data
   * @param count Number of servers to generate (default: 150)
   */
  generateServers(count = 150): Server[] {
    const servers: Server[] = [];

    for (let i = 1; i <= count; i++) {
      const baseName = this.randomItem(this.names);
      const status = this.randomItem(SERVER_STATUSES);
      
      // Error status tends to have more warnings
      const warningsCount = status === 'Error' 
        ? Math.floor(Math.random() * 10) + 2 
        : Math.floor(Math.random() * 3);

      servers.push({
        id: i,
        name: `${baseName}-${String(i).padStart(3, '0')}`,
        serial: `SRV-${String(Math.floor(Math.random() * 900000) + 100000)}`,
        status: status as ServerStatus,
        assetName: this.randomItem(ASSET_TYPES) as AssetType,
        serverType: this.randomItem(SERVER_TYPES) as ServerType,
        hardware: this.randomItem(HARDWARE_TYPES) as HardwareType,
        license: this.randomItem(LICENSE_TYPES) as LicenseType,
        version: this.randomItem(this.versions),
        warningsCount,
        lastCommDate: this.randomDate(365).toISOString().split('T')[0]
      });
    }

    return servers;
  }

  /**
   * Generate a larger dataset for performance testing
   * @param count Number of servers (default: 1000)
   */
  generateLargeDataset(count = 1000): Server[] {
    return this.generateServers(count);
  }

  private randomItem<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private randomDate(daysBack: number): Date {
    const now = Date.now();
    const randomMs = Math.random() * daysBack * 24 * 60 * 60 * 1000;
    return new Date(now - randomMs);
  }
}
