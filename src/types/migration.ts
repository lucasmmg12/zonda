export type MigrationSource = 'Sistema ERP Legacy' | 'Tango Gestión' | 'Bejerman' | 'Excel / CSV' | 'API Externa';

export type MigrationMode = 'DRY_RUN' | 'STAGING' | 'PRODUCTION_BLOCKED';

export interface LegacyErpConnectionConfig {
  endpointUrl: string; // e.g., https://api.erp-gateway.local/v1/rpc
  usuario: string;
  claveSesion?: string;
  idEmpresa?: string;
  cuitEmpresa?: string;
}

export type EntityToMigrate = 
  | 'CLIENTES'
  | 'PROVEEDORES'
  | 'FACTURAS_VENTA'
  | 'FACTURAS_COMPRA'
  | 'PLAN_DE_CUENTAS'
  | 'ASIENTOS_HISTORICOS'
  | 'CHEQUES'
  | 'CUENTAS_BANCARIAS'
  | 'INVENTARIO';

export interface MigrationStepStatus {
  entity: EntityToMigrate;
  totalRecordsSource: number;
  validRecords: number;
  invalidRecords: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  warnings: string[];
  errors: string[];
}

export interface DryRunReport {
  id: string;
  timestamp: string;
  source: MigrationSource;
  mode: MigrationMode;
  targetEnvironment: string;
  isBlockedForProduction: boolean;
  totalEntitiesSelected: number;
  totalRecordsEstimated: number;
  steps: MigrationStepStatus[];
  schemaDifferences: {
    sourceField: string;
    targetField: string;
    transformationApplied: string;
  }[];
  integrityCheckPassed: boolean;
}
