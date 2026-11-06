import React, { useState, useMemo } from 'react';
import {
  Cloud,
  ShieldCheck,
  Lock,
  Unlock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  RefreshCw,
  ArrowRight,
  Users,
  FileCheck2,
  Sparkles,
  Scale,
  X
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { ClasificacionFiscalCompraArca } from '../../services/multiTenantZondaCloudService';
import { generateLibroIvaDigitalRg4597, downloadTxtFile } from '../../utils/afipLibroIvaDigital';
import { printFinancialReport } from '../../utils/exportUtils';
import {
  buildRT54MappedWorkbook,
  downloadRT54OfficialExcel
} from '../../utils/rt54BalanceMapper';

export const ZondaCloudModule: React.FC = () => {
  const {
    tenants,
    activeTenantId,
    cambiarTenantActivo,
    crearNuevoTenant,
    actualizarAutorizacionZondaCloud,
    obtenerSnapshotDeTenant,
    actualizarClasificacionFiscalCompraEnTenant,
    incorporarComprobanteMisComprobantesArcaEnTenant,
    registrarComprobanteFiscalDesdeZondaCloud,
    setActiveModule
  } = useErp();

  const [selectedCloudTenantId, setSelectedCloudTenantId] = useState<string>(activeTenantId);
  const [subTabCloud, setSubTabCloud] = useState<
    | 'ventas_arca'
    | 'compras_arca'
    | 'mis_comprobantes'
    | 'liquidacion_f2002'
    | 'impuestos_integrales'
    | 'balances_arca'
    | 'bitacora'
  >('liquidacion_f2002');
  const [periodoFiscal, setPeriodoFiscal] = useState('2026-10');
  const [avisoOperacion, setAvisoOperacion] = useState<string | null>(null);

  // Parámetros de Balance Anual y Ajuste por Inflación (RT 54 FACPCE + RG 5908 F.713 + RG 4626 PUB)
  const [coefInflacionAnualIpc, setCoefInflacionAnualIpc] = useState<number>(38.5);
  const [bienesDeUsoNetos, setBienesDeUsoNetos] = useState<number>(48500000);
  const [capitalSocialHistorico, setCapitalSocialHistorico] = useState<number>(25000000);
  const [anticiposGananciasPagados, setAnticiposGananciasPagados] = useState<number>(1850000);
  const [gastosNoDeduciblesImpositivos, setGastosNoDeduciblesImpositivos] = useState<number>(420000);

  // Parámetros de Carátula Societaria y Controles Oficiales Plantilla RT54.xlsx (22 Hojas CPCE / FACPCE)
  const [rt54DomicilioLegal, setRt54DomicilioLegal] = useState<string>('Av. Libertador Gral. San Martín 1250 Oeste - San Juan');
  const [rt54RpcInscripcion, setRt54RpcInscripcion] = useState<string>('Legajo Nº 4.812 - Folio 118 - Tomo XII R.P.C. San Juan');
  const [rt54FechaRpc, setRt54FechaRpc] = useState<string>('15/03/2018');
  const [rt54EjercicioNro, setRt54EjercicioNro] = useState<string>('8');
  const [rt54FechaInicio, setRt54FechaInicio] = useState<string>('2026-01-01');
  const [rt54FechaCierre, setRt54FechaCierre] = useState<string>('2026-12-31');
  const [rt54FechaInforme, setRt54FechaInforme] = useState<string>('2027-03-25');
  const [rt54ModeloPi, setRt54ModeloPi] = useState<'Costo' | 'Valor Razonable'>('Costo');
  const [rt54ModeloEepn, setRt54ModeloEepn] = useState<'EEPN (1)' | 'EEPN (2)'>('EEPN (1)');
  const [rt54ReservaLegal, setRt54ReservaLegal] = useState<number>(2500000);
  const [rt54DepEjercicioBsUso, setRt54DepEjercicioBsUso] = useState<number>(4850000);
  const [rt54VistaInspector, setRt54VistaInspector] = useState<
    'resumen_cuadre' | 'notas_22' | 'anexo_ix_gastos' | 'anexo_viii_cmv' | 'eepn_efe'
  >('notas_22');
  const [exportandoRt54Xlsx, setExportandoRt54Xlsx] = useState<boolean>(false);

  // Modal Nueva Empresa (Nuevo Tenant Aislado)
  const [showNuevoTenantModal, setShowNuevoTenantModal] = useState(false);
  const [ntRazonSocial, setNtRazonSocial] = useState('');
  const [ntFantasia, setNtFantasia] = useState('');
  const [ntCuit, setNtCuit] = useState('30-71998877-6');
  const [ntCondIva, setNtCondIva] = useState('Responsable Inscripto');
  const [ntActividad, setNtActividad] = useState('620100 - Servicios de consultoría y desarrollo de software');
  const [ntJurisdiccion, setNtJurisdiccion] = useState('918 - San Juan (DGR)');
  const [ntConvenioMulti, setNtConvenioMulti] = useState(false);
  const [ntAutorizarCloud, setNtAutorizarCloud] = useState(true);

  // Modal Carga Fiscal Rápida (Compra o Venta desde Zonda Cloud)
  const [showCargaFiscalModal, setShowCargaFiscalModal] = useState(false);
  const [cfFlujo, setCfFlujo] = useState<'COMPRA' | 'VENTA'>('COMPRA');
  const [cfTipo, setCfTipo] = useState<'Factura A' | 'Factura B' | 'Factura C' | 'Nota de Débito'>('Factura A');
  const [cfPtoVta, setCfPtoVta] = useState('0001');
  const [cfNumero, setCfNumero] = useState('00054810');
  const [cfFecha, setCfFecha] = useState('2026-10-30');
  const [cfCuit, setCfCuit] = useState('30-50001234-5');
  const [cfRazonSocial, setCfRazonSocial] = useState('');
  const [cfNeto, setCfNeto] = useState(1000000);
  const [cfAlicuota, setCfAlicuota] = useState<21 | 10.5 | 0>(21);
  const [cfPercIva, setCfPercIva] = useState(0);
  const [cfPercIibb, setCfPercIibb] = useState(0);
  const [cfComputabilidad, setCfComputabilidad] =
    useState<ClasificacionFiscalCompraArca['computabilidadIva']>('COMPUTABLE_100');
  const [cfRubro, setCfRubro] =
    useState<ClasificacionFiscalCompraArca['rubroF2002']>('BIENES_DE_CAMBIO');
  const [cfDesc, setCfDesc] = useState('Imputación contable e impositiva desde Zonda Cloud');

  const tenantCloudActual =
    tenants.find((t) => t.tenantId === selectedCloudTenantId) || tenants[0];
  const authCloud = tenantCloudActual.autorizacionZondaCloud;
  const snapTenant = obtenerSnapshotDeTenant(tenantCloudActual.tenantId);

  // Cálculos Impositivos ARCA en Vivo para el Tenant Seleccionado
  const liquidacionCalculada = useMemo(() => {
    const ventas = snapTenant.facturasVenta;
    const compras = snapTenant.facturasCompra;
    const clasifMap = snapTenant.clasificacionesComprasArca || {};
    const coefProrrateo = (authCloud.porcentajeProrrateoIvaArt13 ?? 100) / 100;

    // 1. Débito Fiscal (Ventas)
    const netoVentasGravado = ventas.reduce((acc, v) => acc + (v.iva21 + v.iva105 > 0 ? v.netoGravado : 0), 0);
    const netoVentasExento = ventas.reduce((acc, v) => acc + (v.iva21 + v.iva105 === 0 ? v.netoGravado : 0), 0);
    const debitoIva21 = ventas.reduce((acc, v) => acc + (v.iva21 || 0), 0);
    const debitoIva105 = ventas.reduce((acc, v) => acc + (v.iva105 || 0), 0);
    const totalDebitoFiscal = Number((debitoIva21 + debitoIva105).toFixed(2));

    // 2. Crédito Fiscal Bruto vs Computable (Compras bajo Art. 12 y 13 Ley 20.631)
    let netoComprasTotal = 0;
    let creditoFiscalFacturadoBruto = 0;
    let creditoFiscalComputable = 0;
    let creditoFiscalNoComputableProrrateo = 0;
    let percepcionesIvaCompras = 0;
    let percepcionesIibbCompras = 0;

    compras.forEach((c) => {
      netoComprasTotal += c.netoGravado;
      const ivaFactura = c.iva || 0;
      creditoFiscalFacturadoBruto += ivaFactura;

      const meta = clasifMap[c.id];
      const comp = meta?.computabilidadIva || 'COMPUTABLE_100';
      if (comp === 'COMPUTABLE_100') {
        creditoFiscalComputable += ivaFactura;
      } else if (comp === 'PRORRATEO_ART_13') {
        const parteComputable = ivaFactura * coefProrrateo;
        creditoFiscalComputable += parteComputable;
        creditoFiscalNoComputableProrrateo += ivaFactura - parteComputable;
      } else {
        creditoFiscalNoComputableProrrateo += ivaFactura;
      }

      percepcionesIvaCompras += meta?.percepcionIva ?? c.retencionIva ?? 0;
      percepcionesIibbCompras += meta?.percepcionIibb ?? c.retencionIIBB ?? 0;
    });

    creditoFiscalFacturadoBruto = Number(creditoFiscalFacturadoBruto.toFixed(2));
    creditoFiscalComputable = Number(creditoFiscalComputable.toFixed(2));
    creditoFiscalNoComputableProrrateo = Number(creditoFiscalNoComputableProrrateo.toFixed(2));

    // 3. Saldo Técnico de IVA (1° Párrafo Art. 24 Ley IVA)
    const saldoTecnicoAnterior = authCloud.saldoTecnicoAnteriorIva || 0;
    const subTotalTecnico = Number(
      (totalDebitoFiscal - creditoFiscalComputable - saldoTecnicoAnterior).toFixed(2)
    );
    const saldoTecnicoAFavorContribuyente = subTotalTecnico < 0 ? Math.abs(subTotalTecnico) : 0;
    const saldoTecnicoAFavorArca = subTotalTecnico > 0 ? subTotalTecnico : 0;

    // 4. Saldo de Libre Disponibilidad (2° Párrafo Art. 24: Retenciones + Percepciones IVA)
    const sldAnterior = authCloud.saldoLibreDisponibilidadAnterior || 0;
    const retIvaMes = authCloud.retencionesIvaSufridasMes || 0;
    const totalLibreDisponibilidad = Number(
      (sldAnterior + retIvaMes + percepcionesIvaCompras).toFixed(2)
    );

    const saldoFinalIvaAPagar = Math.max(0, Number((saldoTecnicoAFavorArca - totalLibreDisponibilidad).toFixed(2)));
    const sldRemanenteProximoMes = Math.max(
      0,
      Number((totalLibreDisponibilidad - saldoTecnicoAFavorArca).toFixed(2))
    );

    // 5. Ingresos Brutos (DGR / SIFERE Convenio Multilateral)
    const baseImponibleIibb = Number((netoVentasGravado + netoVentasExento).toFixed(2));
    const alicuotaIibb = authCloud.alicuotaIibbPromedio || 3.0;
    const impuestoDeterminadoIibb = Number(((baseImponibleIibb * alicuotaIibb) / 100).toFixed(2));
    const saldoIibbAPagar = Math.max(
      0,
      Number((impuestoDeterminadoIibb - percepcionesIibbCompras).toFixed(2))
    );

    // 6. Cargas Sociales y Seguridad Social (F.931 ARCA desde Nómina de Empleados del Tenant)
    const masaSalarialRemunerativa = snapTenant.empleados.reduce(
      (acc, emp) => acc + (emp.sueldoBasico || 0) * 1.25,
      0
    );
    const aportesSipa11 = Number((masaSalarialRemunerativa * 0.11).toFixed(2));
    const aportesPami3 = Number((masaSalarialRemunerativa * 0.03).toFixed(2));
    const aportesObraSocial3 = Number((masaSalarialRemunerativa * 0.03).toFixed(2));
    const contribucionesPatronales204 = Number((masaSalarialRemunerativa * 0.204).toFixed(2));
    const cuotaArt35 = Number((masaSalarialRemunerativa * 0.035).toFixed(2));
    const totalF931APagar = Number(
      (aportesSipa11 + aportesPami3 + aportesObraSocial3 + contribucionesPatronales204 + cuotaArt35).toFixed(2)
    );

    // 7. Estados Contables (RT 54 FACPCE) + Ajuste por Inflación (RECPAM / AXII) + Ganancias F.713 (RG 5908)
    const cajaYBancos = Math.max(
      0,
      Number(snapTenant.cuentasBancarias.reduce((acc, c) => acc + c.saldoActual, 0).toFixed(2))
    );
    const creditosPorVentas = Math.max(
      0,
      Number(snapTenant.clientes.reduce((acc, c) => acc + c.saldo, 0).toFixed(2))
    );
    const bienesDeCambio = Math.max(
      0,
      Number(
        snapTenant.inventario
          .reduce((acc, art) => acc + Math.max(0, art.stockActual) * art.costoCalculado, 0)
          .toFixed(2)
      )
    );
    const otrosCreditosFiscales = Number(
      (saldoTecnicoAFavorContribuyente + sldRemanenteProximoMes + anticiposGananciasPagados).toFixed(2)
    );
    const totalActivoCorriente = Number(
      (cajaYBancos + creditosPorVentas + bienesDeCambio + otrosCreditosFiscales).toFixed(2)
    );
    const totalActivoNoCorriente = Number(bienesDeUsoNetos.toFixed(2));
    const totalActivo = Number((totalActivoCorriente + totalActivoNoCorriente).toFixed(2));

    const deudasComercialesProveedores = Math.max(
      0,
      Number(snapTenant.proveedores.reduce((acc, p) => acc + p.saldo, 0).toFixed(2))
    );
    const deudasFiscalesYSociales = Number(
      (saldoFinalIvaAPagar + saldoIibbAPagar + totalF931APagar).toFixed(2)
    );
    const totalPasivoCorriente = Number(
      (deudasComercialesProveedores + deudasFiscalesYSociales).toFixed(2)
    );
    const totalPasivo = totalPasivoCorriente;

    // Estado de Resultados y Ajuste por Inflación
    const ventasNetasAnuales = Number(((netoVentasGravado + netoVentasExento) * 12).toFixed(2));
    const cmvYGastosOperativosAnuales = Number((netoComprasTotal * 12).toFixed(2));
    const gastosLaboralesAnuales = Number(((masaSalarialRemunerativa + contribucionesPatronales204 + cuotaArt35) * 12).toFixed(2));
    const resultadoOperativoAntesRecpam = Number(
      (ventasNetasAnuales - cmvYGastosOperativosAnuales - gastosLaboralesAnuales).toFixed(2)
    );

    // Exposición monetaria neta al inicio / cierre para RECPAM y AXII Estático
    const posicionMonetariaNeta = Number(
      (cajaYBancos + creditosPorVentas - totalPasivo).toFixed(2)
    );
    const recpamContable = Number(
      ((-posicionMonetariaNeta * (coefInflacionAnualIpc / 100))).toFixed(2)
    );
    const ajusteInflacionImpositivoEstatico = Number(
      ((-posicionMonetariaNeta * (coefInflacionAnualIpc / 100))).toFixed(2)
    );

    const resultadoContableAntesImpuesto = Number(
      (resultadoOperativoAntesRecpam + recpamContable).toFixed(2)
    );
    const resultadoImpositivoGravadoF713 = Math.max(
      0,
      Number(
        (
          resultadoOperativoAntesRecpam +
          ajusteInflacionImpositivoEstatico +
          gastosNoDeduciblesImpositivos
        ).toFixed(2)
      )
    );

    // Escala Progresiva Art. 73 LIG (25% / 30% / 35%)
    const topeTramo1 = 34000000;
    const topeTramo2 = 340000000;
    let impuestoGananciasDeterminado = 0;
    let alicuotaMarginalAplicada = '25%';
    if (resultadoImpositivoGravadoF713 <= topeTramo1) {
      impuestoGananciasDeterminado = resultadoImpositivoGravadoF713 * 0.25;
      alicuotaMarginalAplicada = '25% (Tramo 1)';
    } else if (resultadoImpositivoGravadoF713 <= topeTramo2) {
      impuestoGananciasDeterminado =
        topeTramo1 * 0.25 + (resultadoImpositivoGravadoF713 - topeTramo1) * 0.3;
      alicuotaMarginalAplicada = '30% (Tramo 2)';
    } else {
      impuestoGananciasDeterminado =
        topeTramo1 * 0.25 +
        (topeTramo2 - topeTramo1) * 0.3 +
        (resultadoImpositivoGravadoF713 - topeTramo2) * 0.35;
      alicuotaMarginalAplicada = '35% (Tramo 3)';
    }
    impuestoGananciasDeterminado = Number(impuestoGananciasDeterminado.toFixed(2));
    const saldoGananciasF713APagar = Math.max(
      0,
      Number((impuestoGananciasDeterminado - anticiposGananciasPagados).toFixed(2))
    );

    const resultadoNetoDelEjercicio = Number(
      (resultadoContableAntesImpuesto - impuestoGananciasDeterminado).toFixed(2)
    );
    const patrimonioNetoTotal = Number((totalActivo - totalPasivo).toFixed(2));
    const ajusteDeCapital = Number(
      Math.max(0, patrimonioNetoTotal - capitalSocialHistorico - resultadoNetoDelEjercicio).toFixed(2)
    );

    return {
      netoVentasGravado,
      netoVentasExento,
      debitoIva21,
      debitoIva105,
      totalDebitoFiscal,
      netoComprasTotal,
      creditoFiscalFacturadoBruto,
      creditoFiscalComputable,
      creditoFiscalNoComputableProrrateo,
      saldoTecnicoAnterior,
      saldoTecnicoAFavorContribuyente,
      saldoTecnicoAFavorArca,
      percepcionesIvaCompras,
      percepcionesIibbCompras,
      sldAnterior,
      retIvaMes,
      totalLibreDisponibilidad,
      saldoFinalIvaAPagar,
      sldRemanenteProximoMes,
      baseImponibleIibb,
      alicuotaIibb,
      impuestoDeterminadoIibb,
      saldoIibbAPagar,
      masaSalarialRemunerativa,
      aportesSipa11,
      aportesPami3,
      aportesObraSocial3,
      contribucionesPatronales204,
      cuotaArt35,
      totalF931APagar,
      cajaYBancos,
      creditosPorVentas,
      bienesDeCambio,
      otrosCreditosFiscales,
      totalActivoCorriente,
      totalActivoNoCorriente,
      totalActivo,
      deudasComercialesProveedores,
      deudasFiscalesYSociales,
      totalPasivoCorriente,
      totalPasivo,
      patrimonioNetoTotal,
      ajusteDeCapital,
      ventasNetasAnuales,
      cmvYGastosOperativosAnuales,
      gastosLaboralesAnuales,
      resultadoOperativoAntesRecpam,
      recpamContable,
      ajusteInflacionImpositivoEstatico,
      resultadoContableAntesImpuesto,
      resultadoImpositivoGravadoF713,
      impuestoGananciasDeterminado,
      alicuotaMarginalAplicada,
      saldoGananciasF713APagar,
      resultadoNetoDelEjercicio
    };
  }, [
    snapTenant,
    authCloud,
    coefInflacionAnualIpc,
    bienesDeUsoNetos,
    capitalSocialHistorico,
    anticiposGananciasPagados,
    gastosNoDeduciblesImpositivos
  ]);

  // Motor de Mapeo Integral de las 22 Hojas de la Plantilla Oficial RT54.xlsx
  const rt54Mapped = useMemo(() => {
    const valorOrigenInicio = Math.round(bienesDeUsoNetos * 1.18);
    const depAcumInicio = Math.max(0, valorOrigenInicio - bienesDeUsoNetos);
    return buildRT54MappedWorkbook(tenantCloudActual, snapTenant, {
      domicilioLegal: rt54DomicilioLegal,
      actividadPrincipal: tenantCloudActual.actividadPrincipalArca,
      actividadSecundaria: 'Servicios conexos y comercialización mayorista',
      registroPublicoComercio: rt54RpcInscripcion,
      fechaInscripcionRpc: rt54FechaRpc,
      ejercicioNumero: rt54EjercicioNro,
      fechaInicioIso: rt54FechaInicio,
      fechaCierreIso: rt54FechaCierre,
      fechaInformeIso: rt54FechaInforme,
      modeloPropiedadesInversion: rt54ModeloPi,
      modeloEepn: rt54ModeloEepn,
      coefInflacionAnualIpc,
      bienesDeUsoValorOrigenInicio: valorOrigenInicio,
      bienesDeUsoAltasEjercicio: rt54DepEjercicioBsUso,
      bienesDeUsoDepAcumInicio: depAcumInicio,
      bienesDeUsoDepEjercicio: rt54DepEjercicioBsUso,
      capitalSocialSuscripto: capitalSocialHistorico,
      reservaLegalInicial: rt54ReservaLegal,
      anticiposGananciasPagados,
      gastosNoDeduciblesImpositivos,
      tipoCambioUsdCierre: 1150
    });
  }, [
    tenantCloudActual,
    snapTenant,
    rt54DomicilioLegal,
    rt54RpcInscripcion,
    rt54FechaRpc,
    rt54EjercicioNro,
    rt54FechaInicio,
    rt54FechaCierre,
    rt54FechaInforme,
    rt54ModeloPi,
    rt54ModeloEepn,
    coefInflacionAnualIpc,
    bienesDeUsoNetos,
    rt54DepEjercicioBsUso,
    capitalSocialHistorico,
    rt54ReservaLegal,
    anticiposGananciasPagados,
    gastosNoDeduciblesImpositivos
  ]);

  const handleDescargarExcelRT54Oficial = async () => {
    try {
      setExportandoRt54Xlsx(true);
      await downloadRT54OfficialExcel(rt54Mapped);
      setAvisoOperacion(
        `Balance Oficial RT 54 (.xlsx con las 22 pestañas, fórmulas y formatos intactos) exportado exitosamente para ${tenantCloudActual.razonSocial}.`
      );
    } catch (err: any) {
      setAvisoOperacion(
        `Error al exportar plantilla RT54.xlsx: ${err?.message || 'Error desconocido'}`
      );
    } finally {
      setExportandoRt54Xlsx(false);
    }
  };

  const handleCrearNuevoTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ntRazonSocial.trim() || !ntCuit.trim()) return;
    const creado = crearNuevoTenant({
      razonSocial: ntRazonSocial.trim(),
      nombreFantasia: ntFantasia.trim() || ntRazonSocial.trim(),
      cuit: ntCuit.trim(),
      condicionIva: ntCondIva,
      actividadPrincipalArca: ntActividad,
      jurisdiccionPrincipal: ntJurisdiccion,
      convenioMultilateral: ntConvenioMulti,
      autorizarZondaCloudInicial: ntAutorizarCloud
    });
    setSelectedCloudTenantId(creado.tenantId);
    setShowNuevoTenantModal(false);
    setNtRazonSocial('');
    setNtFantasia('');
    setAvisoOperacion(
      `✓ Nueva empresa Multi-Tenant "${creado.razonSocial}" (${creado.cuit}) creada con su base de datos y usuarios 100% aislados.`
    );
  };

  const handleGuardarComprobanteFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfRazonSocial.trim()) return;
    registrarComprobanteFiscalDesdeZondaCloud(tenantCloudActual.tenantId, {
      flujo: cfFlujo,
      tipo: cfTipo,
      puntoVenta: cfPtoVta,
      numero: cfNumero,
      fecha: cfFecha,
      cuitContraparte: cfCuit,
      razonSocialContraparte: cfRazonSocial,
      netoGravado: cfNeto,
      alicuotaIva: cfAlicuota,
      percepcionIva: cfPercIva,
      percepcionIibb: cfPercIibb,
      computabilidadIva: cfComputabilidad,
      rubroF2002: cfRubro,
      descripcion: cfDesc
    });
    setShowCargaFiscalModal(false);
    setCfRazonSocial('');
    setAvisoOperacion(
      `✓ Comprobante de ${cfFlujo} (${cfTipo} ${cfPtoVta}-${cfNumero}) imputado directamente en el tenant ${tenantCloudActual.razonSocial}.`
    );
  };

  const handleDescargarSicoreTxt = () => {
    const lines = snapTenant.facturasCompra.map((fc, idx) => {
      const meta = snapTenant.clasificacionesComprasArca[fc.id];
      const percIva = meta?.percepcionIva ?? fc.retencionIva ?? 0;
      const cuitLimpio = fc.proveedorCuit.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
      const fechaFmt = fc.fechaComprobante.split('-').reverse().join('/');
      const montoFmt = percIva.toFixed(2).padStart(14, '0');
      return `01${fechaFmt}${String(idx + 1).padStart(8, '0')}${montoFmt}0767242${cuitLimpio}`;
    });
    const blob = new Blob([lines.join('\r\n') || 'SIN RETENCIONES/PERCEPCIONES EN EL PERIODO'], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SICORE_SIRE_${tenantCloudActual.cuit.replace(/\D/g, '')}_${periodoFiscal.replace('-', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCerrarYPublicarLiquidacionArca = () => {
    const nroTransaccion = `ARCA-F2002-${Math.floor(10000000 + Math.random() * 89999999)}`;
    actualizarAutorizacionZondaCloud(
      tenantCloudActual.tenantId,
      {
        estadoUltimaLiquidacion: {
          periodo: periodoFiscal,
          fechaPresentacion: new Date().toISOString().slice(0, 10),
          saldoPagarIva: liquidacionCalculada.saldoFinalIvaAPagar,
          saldoPagarIibb: liquidacionCalculada.saldoIibbAPagar,
          nroTransaccionArca: nroTransaccion
        }
      },
      {
        actor: 'Zonda Cloud (Estudio Contable Autorizado)',
        accion: `CIERRE Y PRESENTACIÓN F.2002 + LIBRO IVA DIGITAL (${periodoFiscal})`,
        detalle: `Transacción ${nroTransaccion} · IVA a ingresar: $${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })} · IIBB a ingresar: $${liquidacionCalculada.saldoIibbAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      }
    );
    setAvisoOperacion(
      `✓ Liquidación ARCA F.2002 (${periodoFiscal}) cerrada y publicada en el Zonda ERP de ${tenantCloudActual.razonSocial} (Transacción ${nroTransaccion}).`
    );
  };

  const pendientesSinIncorporar = snapTenant.pendientesMisComprobantesArca.filter(
    (p) => !p.incorporadoAlErp
  );

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* CABECERA EJECUTIVA ZONDA CLOUD & MULTI-TENANT */}
      <div className="bg-white border border-slate-300 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#047857] uppercase">
              <Cloud className="w-4 h-4" />
              <span>MÓDULO 11 // ZONDA CLOUD &amp; ARQUITECTURA MULTI-TENANT (NORMATIVA ARCA ARGENTINA)</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
              CONSOLA FISCAL DELEGADA MULTI-CUIT // COMPRAS, VENTAS Y LIQUIDACIÓN DE IMPUESTOS ARCA
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Cada empresa opera en su propio <strong>Tenant 100% aislado</strong> (sus usuarios, clientes, stock y bancos nunca se mezclan). Mediante la <strong>Autorización explícita del usuario de Zonda ERP</strong>, desde <strong>Zonda Cloud</strong> podés gestionar sus Compras y Ventas, cruzar con <em>Mis Comprobantes</em> de ARCA y liquidar IVA Digital (RG 4597), F.2002, SICORE/SIRE e Ingresos Brutos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNuevoTenantModal(true)}
              className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Alta Nueva Empresa (Tenant Aislado)</span>
            </button>
          </div>
        </div>

        {/* GRILLA SELECTORA DE USUARIOS / EMPRESAS EN ZONDA CLOUD */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-700 uppercase">
              Usuarios de Zonda ERP Registrados (Zonda Cloud solo gestiona a los usuarios que hayan aceptado):
            </span>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
              {tenants.filter((t) => t.autorizacionZondaCloud.autorizado).length} de {tenants.length} Usuarios Aceptaron
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tenants.map((t) => {
              const isSelectedCloud = t.tenantId === tenantCloudActual.tenantId;
              const isAuthorized = t.autorizacionZondaCloud.autorizado;

              return (
                <div
                  key={t.tenantId}
                  onClick={() => setSelectedCloudTenantId(t.tenantId)}
                  className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                    isSelectedCloud
                      ? 'bg-emerald-50/70 border-2 border-[#064e3b] shadow-sm'
                      : 'bg-slate-50/70 border-slate-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-900 text-white">
                        CUIT {t.cuit}
                      </span>
                      {isAuthorized ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          <span>USUARIO ACEPTÓ ✓</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>SIN ACEPTAR DEL USUARIO</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-extrabold text-slate-900 uppercase truncate">
                      {t.razonSocial}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{t.actividadPrincipalArca}</p>

                    <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#064e3b]" />
                        Titular: {t.usuariosInternos[0]?.nombre || 'Usuario ERP'}
                      </span>
                      <span>{t.jurisdiccionPrincipal.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {isAuthorized ? (
                      <span className="text-[10px] font-mono font-bold text-[#064e3b] bg-white px-2 py-1 border border-emerald-300">
                        ● Gestión Cloud Habilitada
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-2 py-1 border border-rose-300">
                        🔒 Bloqueado (Falta aceptación)
                      </span>
                    )}

                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {isSelectedCloud ? 'Seleccionado ▼' : 'Ver estado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {avisoOperacion && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-400 text-[#042f22] text-xs font-mono font-bold flex items-center justify-between">
          <span>{avisoOperacion}</span>
          <button onClick={() => setAvisoOperacion(null)} className="px-2 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* VERIFICACIÓN DE CONSENTIMIENTO DEL USUARIO DE ZONDA ERP */}
      {!authCloud.autorizado ? (
        <div className="bg-white border-2 border-rose-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-rose-50 border border-rose-300 text-rose-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-mono font-bold text-rose-700 uppercase">
            PROTECCIÓN MULTI-TENANT // ACCESO BLOQUEADO EN ZONDA CLOUD
          </div>
          <h3 className="text-base font-extrabold text-slate-900 uppercase">
            El usuario de &ldquo;{tenantCloudActual.razonSocial}&rdquo; ({tenantCloudActual.cuit}) NO ha aceptado la vinculación con Zonda Cloud
          </h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            En la arquitectura Multi-Tenant de Zonda ERP, <strong>cada usuario ve únicamente lo suyo</strong> y <strong>Zonda Cloud solo puede gestionar a los usuarios que hayan aceptado</strong>. Para desbloquear este cliente, su titular (<strong>{tenantCloudActual.usuariosInternos[0]?.nombre || 'Usuario Titular'}</strong>) debe iniciar sesión con su propio usuario de Zonda ERP y presionar el botón <strong>&ldquo;Aceptar Zonda Cloud&rdquo;</strong> en la barra superior o en <em>09 - Configuración Fiscal</em>.
          </p>
        </div>
      ) : (
        /* PANEL OPERATIVO ZONDA CLOUD PARA EL CLIENTE AUTORIZADO */
        <div className="bg-white border border-slate-300 shadow-sm">
          {/* Barra de Estado de Vinculación y Usuarios Aislados del Tenant */}
          <div className="p-4 bg-[#042f22] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500 text-[#042f22] text-[10px] font-mono font-extrabold uppercase">
                  CONEXIÓN AUTORIZADA POR USUARIO ERP
                </span>
                <span className="text-xs font-mono text-emerald-200">
                  Token: <strong>{authCloud.tokenVinculacion}</strong> · Otorgado por: {authCloud.autorizadoPorUsuarioErp}
                </span>
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                GESTIONANDO IMPUESTOS ARCA DE: {tenantCloudActual.razonSocial} (CUIT {tenantCloudActual.cuit})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#064e3b] border border-emerald-600 px-2.5 py-1 text-xs font-mono">
                <span>Período Fiscal ARCA:</span>
                <input
                  type="month"
                  value={periodoFiscal}
                  onChange={(e) => setPeriodoFiscal(e.target.value)}
                  className="bg-transparent font-bold text-emerald-200 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCfFlujo('COMPRA');
                  setShowCargaFiscalModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#042f22] text-xs font-mono font-extrabold uppercase flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cargar Compra / Venta Fiscal</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  actualizarAutorizacionZondaCloud(
                    tenantCloudActual.tenantId,
                    { autorizado: false },
                    {
                      actor: `Titular Zonda ERP (${tenantCloudActual.razonSocial})`,
                      accion: 'REVOCACIÓN DE ACCESO ZONDA CLOUD',
                      detalle: 'El usuario de Zonda ERP suspendió temporalmente el acceso delegado.'
                    }
                  )
                }
                className="px-2.5 py-1.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 border border-rose-500/40 text-[11px] font-mono font-bold uppercase"
                title="Revocar autorización del estudio contable"
              >
                Revocar Autorización
              </button>
            </div>
          </div>

          {/* Tira de Usuarios Aislados de este Tenant (Demostración Multi-Tenant) */}
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 uppercase">
                Usuarios Internos de este Tenant (No ven datos de otras empresas):
              </span>
              {tenantCloudActual.usuariosInternos.map((u) => (
                <span
                  key={u.id}
                  className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 font-semibold"
                >
                  {u.nombre} <span className="text-emerald-700">[{u.rol}]</span>
                </span>
              ))}
            </div>
            <span className="text-slate-500">
              Jurisdicción IIBB: <strong>{tenantCloudActual.jurisdiccionPrincipal}</strong>
            </span>
          </div>

          {/* Sub-Navegación de Zonda Cloud */}
          <div className="flex flex-wrap border-b border-slate-300 bg-slate-50 text-xs font-mono">
            {[
              {
                id: 'liquidacion_f2002',
                label: '1. Portal IVA Simple (F.2051 / F.2002) & Libro IVA Digital'
              },
              {
                id: 'impuestos_integrales',
                label: '2. Todos los Impuestos (IIBB CM03 / SICORE / F.931 / Ganancias F.713)'
              },
              {
                id: 'balances_arca',
                label: '3. Balances ARCA (PUB RG 4626 + Ganancias Web RG 5908 + RT 54)'
              },
              {
                id: 'compras_arca',
                label: `4. Compras y Crédito Fiscal (${snapTenant.facturasCompra.length})`
              },
              {
                id: 'ventas_arca',
                label: `5. Ventas y Débito Fiscal (${snapTenant.facturasVenta.length})`
              },
              {
                id: 'mis_comprobantes',
                label: `6. Cruce "Mis Comprobantes" ARCA (${pendientesSinIncorporar.length})`
              },
              {
                id: 'bitacora',
                label: `7. Bitácora Delegada (${authCloud.bitacoraCloud.length})`
              }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTabCloud(t.id as any)}
                className={`px-4 py-2.5 font-bold border-r border-slate-200 transition-colors ${
                  subTabCloud === t.id
                    ? 'bg-white text-[#064e3b] border-t-2 border-t-[#064e3b] -mb-[1px]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* CONTENIDO DE CADA PESTAÑA DE ZONDA CLOUD */}
          <div className="p-5">
            {subTabCloud === 'liquidacion_f2002' && (
              <div className="space-y-5">
                {/* Tarjetas Resumen F.2002 + IIBB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 border border-slate-300 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      1. DÉBITO FISCAL VENTAS (ARCA)
                    </span>
                    <p className="text-lg font-extrabold text-rose-800 mt-1">
                      ${liquidacionCalculada.totalDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Neto Grav.: ${liquidacionCalculada.netoVentasGravado.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="p-3.5 border border-slate-300 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      2. CRÉDITO FISCAL COMPUTABLE (ART. 12/13)
                    </span>
                    <p className="text-lg font-extrabold text-emerald-800 mt-1">
                      ${liquidacionCalculada.creditoFiscalComputable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Facturado Bruto: ${liquidacionCalculada.creditoFiscalFacturadoBruto.toLocaleString('es-AR')} (Prorrateo: {authCloud.porcentajeProrrateoIvaArt13}%)
                    </span>
                  </div>

                  <div className="p-3.5 border-2 border-[#064e3b] bg-emerald-50/60">
                    <span className="text-[10px] font-bold text-[#042f22] uppercase block">
                      3. SALDO FINAL IVA A INGRESAR (F.2002)
                    </span>
                    <p className="text-lg font-extrabold text-[#042f22] mt-1">
                      ${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-emerald-900 block mt-0.5">
                      {liquidacionCalculada.saldoTecnicoAFavorContribuyente > 0
                        ? `Saldo Técnico a Favor: $${liquidacionCalculada.saldoTecnicoAFavorContribuyente.toLocaleString('es-AR')}`
                        : `Deduce SLD/Ret./Perc.: $${liquidacionCalculada.totalLibreDisponibilidad.toLocaleString('es-AR')}`}
                    </span>
                  </div>

                  <div className="p-3.5 border border-amber-300 bg-amber-50/50">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">
                      4. INGRESOS BRUTOS (DGR / SIFERE)
                    </span>
                    <p className="text-lg font-extrabold text-amber-950 mt-1">
                      ${liquidacionCalculada.saldoIibbAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-amber-800 block mt-0.5">
                      Alíc. {liquidacionCalculada.alicuotaIibb}% s/Base − Perc. IIBB (${liquidacionCalculada.percepcionesIibbCompras.toLocaleString('es-AR')})
                    </span>
                  </div>
                </div>

                {/* Parámetros Editables del Contador en Zonda Cloud (Saldos Anteriores, Retenciones y Prorrateo Art. 13) */}
                <div className="p-4 bg-slate-50 border border-slate-300 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#064e3b]" />
                      <span>Parámetros Técnicos de Liquidación ARCA (Editables por Zonda Cloud):</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Recálculo instantáneo de F.2002 y DGR/SIFERE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        % Prorrateo IVA (Art. 13):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={authCloud.porcentajeProrrateoIvaArt13}
                        onChange={(e) =>
                          actualizarAutorizacionZondaCloud(tenantCloudActual.tenantId, {
                            porcentajeProrrateoIvaArt13: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Saldo Técnico Per. Ant. ($):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={authCloud.saldoTecnicoAnteriorIva}
                        onChange={(e) =>
                          actualizarAutorizacionZondaCloud(tenantCloudActual.tenantId, {
                            saldoTecnicoAnteriorIva: Math.max(0, parseFloat(e.target.value) || 0)
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Saldo Libre Disp. Ant. ($):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={authCloud.saldoLibreDisponibilidadAnterior}
                        onChange={(e) =>
                          actualizarAutorizacionZondaCloud(tenantCloudActual.tenantId, {
                            saldoLibreDisponibilidadAnterior: Math.max(0, parseFloat(e.target.value) || 0)
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Retenciones IVA Sufridas ($):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={authCloud.retencionesIvaSufridasMes}
                        onChange={(e) =>
                          actualizarAutorizacionZondaCloud(tenantCloudActual.tenantId, {
                            retencionesIvaSufridasMes: Math.max(0, parseFloat(e.target.value) || 0)
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Alícuota IIBB Actividad (%):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={authCloud.alicuotaIibbPromedio}
                        onChange={(e) =>
                          actualizarAutorizacionZondaCloud(tenantCloudActual.tenantId, {
                            alicuotaIibbPromedio: Math.max(0, parseFloat(e.target.value) || 0)
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Papel de Trabajo F.2002 ARCA + Exportadores Oficiales TXT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="border border-slate-300 p-4 space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                      DETERMINACIÓN DEL IMPUESTO AL VALOR AGREGADO (F.2002 ARCA)
                    </h4>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+) Débito Fiscal IVA 21% y 10.5% (Ventas):</span>
                      <span className="font-bold text-rose-700">
                        ${liquidacionCalculada.totalDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Crédito Fiscal Computable (Compras Art. 12 y 13):</span>
                      <span className="font-bold text-emerald-700">
                        -${liquidacionCalculada.creditoFiscalComputable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                      <span>(i) Crédito Fiscal No Computable por Prorrateo Art. 13:</span>
                      <span>
                        ${liquidacionCalculada.creditoFiscalNoComputableProrrateo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Saldo Técnico a Favor Período Anterior (1° Párr.):</span>
                      <span className="font-bold text-emerald-700">
                        -${liquidacionCalculada.saldoTecnicoAnterior.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Percepciones de IVA en Compras + Retenciones Sufridas:</span>
                      <span className="font-bold text-emerald-700">
                        -${liquidacionCalculada.totalLibreDisponibilidad.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-50 px-2 font-extrabold text-[#042f22] text-sm">
                      <span>(=) SALDO DE IVA A INGRESAR A ARCA:</span>
                      <span>
                        ${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-300 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                        ARCHIVOS OFICIALES ARCA (RG 4597 / SIRE / SICORE) PARA ESTE CUIT
                      </h4>
                      <p className="text-[11px] text-slate-600 font-sans">
                        Generá los archivos posicionales exactos a partir de las Compras y Ventas auditadas de{' '}
                        <strong>{tenantCloudActual.razonSocial}</strong>:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const pack = generateLibroIvaDigitalRg4597(snapTenant.facturasVenta, snapTenant.facturasCompra);
                            downloadTxtFile(`LIBRO_IVA_DIGITAL_VENTAS_CBTE_${periodoFiscal.replace('-', '')}.txt`, pack.ventasCbteTxt);
                          }}
                          className="p-2 bg-slate-100 hover:bg-emerald-50 border border-slate-300 text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>TXT Ventas Comprobantes</span>
                          <Download className="w-3.5 h-3.5 text-[#064e3b]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pack = generateLibroIvaDigitalRg4597(snapTenant.facturasVenta, snapTenant.facturasCompra);
                            downloadTxtFile(`LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS_${periodoFiscal.replace('-', '')}.txt`, pack.ventasAlicuotasTxt);
                          }}
                          className="p-2 bg-slate-100 hover:bg-emerald-50 border border-slate-300 text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>TXT Ventas Alícuotas</span>
                          <Download className="w-3.5 h-3.5 text-[#064e3b]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pack = generateLibroIvaDigitalRg4597(snapTenant.facturasVenta, snapTenant.facturasCompra);
                            downloadTxtFile(`LIBRO_IVA_DIGITAL_COMPRAS_CBTE_${periodoFiscal.replace('-', '')}.txt`, pack.comprasCbteTxt);
                          }}
                          className="p-2 bg-slate-100 hover:bg-emerald-50 border border-slate-300 text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>TXT Compras Comprobantes</span>
                          <Download className="w-3.5 h-3.5 text-[#064e3b]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pack = generateLibroIvaDigitalRg4597(snapTenant.facturasVenta, snapTenant.facturasCompra);
                            downloadTxtFile(`LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS_${periodoFiscal.replace('-', '')}.txt`, pack.comprasAlicuotasTxt);
                          }}
                          className="p-2 bg-slate-100 hover:bg-emerald-50 border border-slate-300 text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>TXT Compras Alícuotas</span>
                          <Download className="w-3.5 h-3.5 text-[#064e3b]" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleDescargarSicoreTxt}
                          className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>TXT SICORE / SIRE (RG 2233)</span>
                          <Download className="w-3.5 h-3.5 text-amber-800" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            printFinancialReport(
                              `Liquidación Fiscal ARCA F.2002 & IIBB — ${tenantCloudActual.razonSocial}`,
                              `CUIT: ${tenantCloudActual.cuit} · Período Fiscal: ${periodoFiscal} · Generado por Zonda Cloud`,
                              ['Concepto Fiscal ARCA / DGR', 'Base / Referencia', 'Importe ($ ARS)'],
                              [
                                ['Débito Fiscal Ventas (IVA 21% + 10.5%)', `${snapTenant.facturasVenta.length} comprobantes`, `$${liquidacionCalculada.totalDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                                ['Crédito Fiscal Computable (Art. 12 y 13)', `Prorrateo ${authCloud.porcentajeProrrateoIvaArt13}%`, `-$${liquidacionCalculada.creditoFiscalComputable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                                ['Saldo Técnico Anterior + Libre Disponibilidad', 'Retenciones y Percepciones IVA', `-$${(liquidacionCalculada.saldoTecnicoAnterior + liquidacionCalculada.totalLibreDisponibilidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                                ['SALDO FINAL IVA A INGRESAR (F.2002)', 'ARCA VEP', `$${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                                ['INGRESOS BRUTOS A PAGAR (DGR / SIFERE)', `Alícuota ${liquidacionCalculada.alicuotaIibb}% neto de percepciones`, `$${liquidacionCalculada.saldoIibbAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`]
                              ]
                            )
                          }
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white text-left flex items-center justify-between text-[11px] font-bold"
                        >
                          <span>Imprimir Papel de Trabajo PDF</span>
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCerrarYPublicarLiquidacionArca}
                      className="w-full py-2.5 bg-[#064e3b] hover:bg-[#047857] text-white font-extrabold uppercase text-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cerrar Liquidación {periodoFiscal} y Publicar en el ERP del Cliente</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {subTabCloud === 'compras_arca' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase">
                      AUDITORÍA DE COMPRAS Y CLASIFICACIÓN DE CRÉDITO FISCAL COMPUTABLE (LEY IVA ART. 12 Y 13)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Definí en cada factura de compra de <strong>{tenantCloudActual.razonSocial}</strong> si el IVA es 100% Computable, sujeto a Prorrateo ({authCloud.porcentajeProrrateoIvaArt13}%) o No Computable, y su rubro para el F.2002.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCfFlujo('COMPRA');
                      setShowCargaFiscalModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#064e3b] text-white font-bold uppercase text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Cargar Factura de Compra</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                        <th className="py-2 px-2.5">Fecha / Cbte.</th>
                        <th className="py-2 px-2.5">Proveedor / CUIT</th>
                        <th className="py-2 px-2.5 text-right">Neto ($)</th>
                        <th className="py-2 px-2.5 text-right">IVA Facturado ($)</th>
                        <th className="py-2 px-2.5">Computabilidad IVA (ARCA)</th>
                        <th className="py-2 px-2.5">Rubro F.2002</th>
                        <th className="py-2 px-2.5 text-right">Perc. IVA / IIBB ($)</th>
                        <th className="py-2 px-2.5 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {snapTenant.facturasCompra.map((fc) => {
                        const meta = snapTenant.clasificacionesComprasArca[fc.id] || {
                          facturaCompraId: fc.id,
                          codigoComprobanteArca: '001',
                          computabilidadIva: 'COMPUTABLE_100',
                          rubroF2002: 'BIENES_DE_CAMBIO',
                          percepcionIva: fc.retencionIva || 0,
                          percepcionIibb: fc.retencionIIBB || 0,
                          conciliadoMisComprobantesArca: true
                        };

                        return (
                          <tr key={fc.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-slate-900 block">
                                {fc.tipo} {fc.numero}
                              </span>
                              <span className="text-[10px] text-slate-500">{fc.fechaComprobante}</span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-slate-800 block">{fc.proveedorNombre}</span>
                              <span className="text-[10px] text-slate-500">CUIT {fc.proveedorCuit}</span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold">
                              ${fc.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-800">
                              ${fc.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5">
                              <select
                                value={meta.computabilidadIva}
                                onChange={(e) =>
                                  actualizarClasificacionFiscalCompraEnTenant(
                                    tenantCloudActual.tenantId,
                                    fc.id,
                                    { computabilidadIva: e.target.value as any }
                                  )
                                }
                                className="w-full p-1 bg-emerald-50 border border-emerald-300 font-bold text-[#042f22] text-[10px]"
                              >
                                <option value="COMPUTABLE_100">100% Computable (Directo)</option>
                                <option value="PRORRATEO_ART_13">
                                  Prorrateo Art. 13 ({authCloud.porcentajeProrrateoIvaArt13}%)
                                </option>
                                <option value="NO_COMPUTABLE">No Computable (Exento/Costo)</option>
                              </select>
                            </td>
                            <td className="py-2 px-2.5">
                              <select
                                value={meta.rubroF2002}
                                onChange={(e) =>
                                  actualizarClasificacionFiscalCompraEnTenant(
                                    tenantCloudActual.tenantId,
                                    fc.id,
                                    { rubroF2002: e.target.value as any }
                                  )
                                }
                                className="w-full p-1 bg-white border border-slate-300 text-[10px]"
                              >
                                <option value="BIENES_DE_CAMBIO">Bienes de Cambio / Insumos</option>
                                <option value="BIENES_DE_USO">Bienes de Uso</option>
                                <option value="SERVICIOS_Y_GASTOS">Locaciones y Servicios</option>
                              </select>
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <span className="block text-[10px]">
                                IVA: ${(meta.percepcionIva || 0).toLocaleString('es-AR')}
                              </span>
                              <span className="block text-[10px] text-amber-800">
                                IIBB: ${(meta.percepcionIibb || 0).toLocaleString('es-AR')}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-extrabold text-slate-900">
                              ${fc.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTabCloud === 'ventas_arca' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase">
                      LIBRO IVA VENTAS &amp; AUDITORÍA DE COMPROBANTES ELECTRÓNICOS CON CAE
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Comprobantes de venta emitidos por <strong>{tenantCloudActual.razonSocial}</strong> que integran el Débito Fiscal y la base imponible de Ingresos Brutos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCfFlujo('VENTA');
                      setShowCargaFiscalModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#064e3b] text-white font-bold uppercase text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Registrar Venta / Ajuste Fiscal</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                        <th className="py-2 px-2.5">Fecha</th>
                        <th className="py-2 px-2.5">Comprobante</th>
                        <th className="py-2 px-2.5">Cliente / CUIT</th>
                        <th className="py-2 px-2.5">Condición IVA</th>
                        <th className="py-2 px-2.5 text-right">Neto ($)</th>
                        <th className="py-2 px-2.5 text-right">IVA 21% ($)</th>
                        <th className="py-2 px-2.5 text-right">IVA 10.5% ($)</th>
                        <th className="py-2 px-2.5 text-right">Total ($)</th>
                        <th className="py-2 px-2.5">CAE ARCA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {snapTenant.facturasVenta.map((fv) => (
                        <tr key={fv.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5">{fv.fechaEmision}</td>
                          <td className="py-2 px-2.5 font-bold text-slate-900">
                            {fv.tipo} {fv.puntoVenta}-{fv.numero}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="font-bold block">{fv.clienteNombre}</span>
                            <span className="text-[10px] text-slate-500">CUIT {fv.clienteCuit}</span>
                          </td>
                          <td className="py-2 px-2.5">{fv.condicionIva}</td>
                          <td className="py-2 px-2.5 text-right font-bold">
                            ${fv.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right text-rose-800">
                            ${fv.iva21.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right text-rose-800">
                            ${fv.iva105.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-extrabold text-slate-900">
                            ${fv.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-emerald-800 font-bold">
                            {fv.cae || 'Homologado'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTabCloud === 'mis_comprobantes' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3.5 bg-amber-50/70 border border-amber-300 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-amber-950 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>
                        CRUCE AUTOMÁTICO CON SERVICIO &ldquo;MIS COMPROBANTES EMITIDOS Y RECIBIDOS&rdquo; DE ARCA
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-700 font-sans mt-0.5">
                      Zonda Cloud compara los comprobantes electrónicos informados en los servidores de ARCA bajo el CUIT{' '}
                      <strong>{tenantCloudActual.cuit}</strong> contra los registrados en Zonda ERP, permitiéndote incorporar en 1 clic las facturas omitidas antes de cerrar el IVA.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                        <th className="py-2 px-2.5">Flujo ARCA</th>
                        <th className="py-2 px-2.5">Fecha / Comprobante</th>
                        <th className="py-2 px-2.5">Emisor / Receptor (CUIT)</th>
                        <th className="py-2 px-2.5 text-right">Neto ($)</th>
                        <th className="py-2 px-2.5 text-right">IVA ($)</th>
                        <th className="py-2 px-2.5 text-right">Perc. IVA/IIBB</th>
                        <th className="py-2 px-2.5 text-right">Total ($)</th>
                        <th className="py-2 px-2.5 text-center">Estado / Acción Zonda Cloud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {snapTenant.pendientesMisComprobantesArca.length > 0 ? (
                        snapTenant.pendientesMisComprobantesArca.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  item.tipoFlujo === 'RECIBIDO_COMPRA'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-indigo-100 text-indigo-900'
                                }`}
                              >
                                {item.tipoFlujo === 'RECIBIDO_COMPRA'
                                  ? 'RECIBIDO (COMPRA)'
                                  : 'EMITIDO (VENTA)'}
                              </span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold block">
                                {item.tipoComprobante} {item.puntoVenta}-{item.numero}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.fechaEmision} · CAE {item.cae}
                              </span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold block">{item.razonSocialContraparte}</span>
                              <span className="text-[10px] text-slate-500">CUIT {item.cuitContraparte}</span>
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold">
                              ${item.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold">
                              ${(item.iva21 + item.iva105).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              ${(item.percepcionIva + item.percepcionIibb).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-right font-extrabold text-slate-900">
                              ${item.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              {item.incorporadoAlErp ? (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase">
                                  ✓ Incorporado al ERP
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    incorporarComprobanteMisComprobantesArcaEnTenant(
                                      tenantCloudActual.tenantId,
                                      item.id
                                    );
                                    setAvisoOperacion(
                                      `✓ Comprobante ${item.tipoComprobante} ${item.puntoVenta}-${item.numero} (${item.razonSocialContraparte}) incorporado al Libro IVA de ${tenantCloudActual.razonSocial}.`
                                    );
                                  }}
                                  className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white text-[10px] font-bold uppercase"
                                >
                                  Incorporar e Imputar en 1 Clic
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Todos los comprobantes de ARCA están conciliados con el ERP de esta empresa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTabCloud === 'impuestos_integrales' && (
              <div className="space-y-5 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase">
                      CENTRO DE LIQUIDACIÓN DE TODOS LOS IMPUESTOS NACIONALES Y PROVINCIALES ({tenantCloudActual.razonSocial})
                    </h4>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Consolida automáticamente IVA Simple (RG 5705 - F.2051/F.2083), Ingresos Brutos (DGR / Convenio Multilateral SIFERE CM03), Retenciones SICORE/SIRE, Seguridad Social (F.931 LSD) e Impuesto a las Ganancias Sociedades (F.713 RG 5908).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      printFinancialReport(
                        `Liquidación Integral de Impuestos ARCA y DGR - ${tenantCloudActual.razonSocial}`,
                        `CUIT ${tenantCloudActual.cuit} · Período ${periodoFiscal}`,
                        ['Impuesto / Régimen', 'Formulario Oficial', 'Base Imponible / Bruto', 'Deducciones / Retenciones', 'Saldo Neto a Ingresar ($)'],
                        [
                          [
                            'IVA Simple (Portal IVA RG 5705)',
                            'F. 2051 / F. 2083',
                            `$${liquidacionCalculada.totalDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${(liquidacionCalculada.creditoFiscalComputable + liquidacionCalculada.totalLibreDisponibilidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          ],
                          [
                            `Ingresos Brutos (${tenantCloudActual.jurisdiccionPrincipal})`,
                            tenantCloudActual.convenioMultilateral ? 'SIFERE Web CM03' : 'DGR Provincial',
                            `$${liquidacionCalculada.baseImponibleIibb.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${liquidacionCalculada.percepcionesIibbCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${liquidacionCalculada.saldoIibbAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          ],
                          [
                            'Seguridad Social y Cargas Sociales',
                            'F. 931 (LSD RG 3781)',
                            `$${liquidacionCalculada.masaSalarialRemunerativa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            '$0,00',
                            `$${liquidacionCalculada.totalF931APagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          ],
                          [
                            'Retenciones y Percepciones Practicadas',
                            'SICORE / SIRE (F. 744)',
                            `$${liquidacionCalculada.percepcionesIvaCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            '$0,00',
                            `$${liquidacionCalculada.percepcionesIvaCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          ],
                          [
                            'Impuesto a las Ganancias Personas Jurídicas (Anual)',
                            'F. 713 Web (RG 5908)',
                            `$${liquidacionCalculada.resultadoImpositivoGravadoF713.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${anticiposGananciasPagados.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                            `$${liquidacionCalculada.saldoGananciasF713APagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          ]
                        ]
                      )
                    }
                    className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Sabana Consolidada de Impuestos (PDF)</span>
                  </button>
                </div>

                {/* Grilla de los 5 Impuestos Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 1. IVA Simple RG 5705 (F.2051 + F.2083) */}
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-[#042f22] uppercase">
                        1. PORTAL IVA — "IVA SIMPLE" (RG 5705 · F. 2051 y F. 2083)
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        MENSUAL
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Débito Fiscal Ventas ({snapTenant.facturasVenta.length} comp.):</span>
                      <span className="font-bold text-rose-700">
                        ${liquidacionCalculada.totalDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Crédito Fiscal Computable ({snapTenant.facturasCompra.length} comp.):</span>
                      <span className="font-bold text-emerald-700">
                        -${liquidacionCalculada.creditoFiscalComputable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Saldo Técnico Ant. + Ret./Perc. SIRE/SICORE:</span>
                      <span className="font-bold text-emerald-700">
                        -${(liquidacionCalculada.saldoTecnicoAnterior + liquidacionCalculada.totalLibreDisponibilidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                      <span>VEP IVA F. 2051 A INGRESAR:</span>
                      <span>${liquidacionCalculada.saldoFinalIvaAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* 2. Ingresos Brutos DGR / Convenio Multilateral SIFERE CM03 */}
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-amber-900 uppercase">
                        2. INGRESOS BRUTOS ({tenantCloudActual.convenioMultilateral ? 'SIFERE CM03' : 'DGR PROVINCIAL'})
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {tenantCloudActual.jurisdiccionPrincipal}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Base Imponible Neta Ventas del Mes:</span>
                      <span className="font-bold">
                        ${liquidacionCalculada.baseImponibleIibb.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Impuesto Determinado (Alícuota {liquidacionCalculada.alicuotaIibb}%):</span>
                      <span className="font-bold text-rose-700">
                        ${liquidacionCalculada.impuestoDeterminadoIibb.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Percepciones IIBB Sufridas en Compras / SIRCREB:</span>
                      <span className="font-bold text-emerald-700">
                        -${liquidacionCalculada.percepcionesIibbCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-amber-50 px-2 font-extrabold text-amber-950">
                      <span>SALDO IIBB A INGRESAR:</span>
                      <span>${liquidacionCalculada.saldoIibbAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* 3. Seguridad Social F.931 (Libro de Sueldos Digital RG 3781) */}
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-900 uppercase">
                        3. SEGURIDAD SOCIAL Y CARGAS SOCIALES (F. 931 · LSD RG 3781)
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold">
                        {snapTenant.empleados.length} LEGAJOS ACTIVOS
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Masa Salarial Remunerativa Liquidada:</span>
                      <span className="font-bold">
                        ${liquidacionCalculada.masaSalarialRemunerativa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Aportes SIPA (11%) + Ley 19.032 (3%) + Obra Social (3%):</span>
                      <span className="font-bold">
                        ${(liquidacionCalculada.aportesSipa11 + liquidacionCalculada.aportesPami3 + liquidacionCalculada.aportesObraSocial3).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Contribuciones Patronales (20.40%) + ART (3.50%):</span>
                      <span className="font-bold">
                        ${(liquidacionCalculada.contribucionesPatronales204 + liquidacionCalculada.cuotaArt35).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-slate-100 px-2 font-extrabold text-slate-900">
                      <span>TOTAL VEP F. 931 A INGRESAR:</span>
                      <span>${liquidacionCalculada.totalF931APagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* 4. Ganancias Personas Jurídicas F.713 Web (RG 5908/2026) */}
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-indigo-950 uppercase">
                        4. GANANCIAS PERSONAS JURÍDICAS (F. 713 WEB · RG 5908/2026)
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-bold">
                        ESCALA {liquidacionCalculada.alicuotaMarginalAplicada}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Resultado Impositivo Gravado (c/Ajuste por Inflación):</span>
                      <span className="font-bold">
                        ${liquidacionCalculada.resultadoImpositivoGravadoF713.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Impuesto Determinado (Art. 73 LIG 25% / 30% / 35%):</span>
                      <span className="font-bold text-rose-700">
                        ${liquidacionCalculada.impuestoGananciasDeterminado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Anticipos Ingresados y Retenciones RG 830:</span>
                      <span className="font-bold text-emerald-700">
                        -${anticiposGananciasPagados.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-indigo-50 px-2 font-extrabold text-indigo-950">
                      <span>SALDO DDJJ F. 713 A INGRESAR:</span>
                      <span>${liquidacionCalculada.saldoGananciasF713APagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subTabCloud === 'balances_arca' && (
              <div className="space-y-5 font-mono text-xs">
                {/* Encabezado y Botones de Exportación: Excel Oficial 22 Hojas RT54.xlsx + PDF Único PUB RG 4626 */}
                <div className="p-4 bg-[#f0fdf4] border-2 border-[#064e3b] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#064e3b] text-white text-[10px] font-extrabold uppercase">
                        RT 54 (T.O. RT 59 FACPCE / CPCE RES. 34/2024) — 22 HOJAS OFICIALES .XLSX
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#042f22] border border-emerald-400 text-[10px] font-extrabold uppercase">
                        {rt54Mapped.estadopat.cuadraActual
                          ? '✔ ACTIVO = PASIVO + PN (CUADRE EXACTO estadopat!I2)'
                          : '⚠ VERIFICAR CUADRE'}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-[#042f22] uppercase">
                      EXPORTADOR OFICIAL DE BALANCE RT 54 (22 PESTAÑAS EXCEL TAL CUAL) + PUB ARCA — {tenantCloudActual.razonSocial}
                    </h4>
                    <p className="text-[11px] text-slate-700 font-sans max-w-3xl">
                      Mapea automáticamente todos los módulos del ERP (<strong>Tesorería, Clientes, Proveedores, Inventario, Sueldos, Contabilidad y Zonda Cloud Fiscal</strong>) hacia las <strong>22 hojas interconectadas de la plantilla oficial <code>RT54.xlsx</code></strong> (<code>Controles</code>, <code>Caratula</code>, <code>estadopat</code>, <code>EstRes</code>, <code>EEPN(1)</code>, <code>EEPN(2)</code>, <code>EFE sintetico/directo/indirecto</code>, <code>Mon Ext</code>, <code>Vencimiento</code>, <code>Bsuso</code>, <code>Intang</code>, <code>PI VR/Costo</code>, <code>Prev</code>, <code>costo de venta</code>, <code>costos y gastos</code>, <code>partes relacionadas</code>, <code>Inversiones</code>, <code>Notas(1)</code> y <code>Notas(2)</code>) conservando intactas todas las fórmulas y formatos originales.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={exportandoRt54Xlsx}
                      onClick={handleDescargarExcelRT54Oficial}
                      className="px-4 py-2.5 bg-[#042f22] hover:bg-[#064e3b] text-white font-extrabold uppercase flex items-center gap-2 shadow-md border border-emerald-400"
                    >
                      <Download className="w-4 h-4 text-emerald-300" />
                      <span>
                        {exportandoRt54Xlsx
                          ? 'Generando 22 Hojas RT54.xlsx...'
                          : 'Exportar Excel Oficial RT 54 (.xlsx - 22 Hojas Tal Cual)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        printFinancialReport(
                          `PRESENTACIÓN ÚNICA DE BALANCES (PUB - RG 4626 ARCA) y F. 713 (RG 5908)`,
                          `${tenantCloudActual.razonSocial} · CUIT ${tenantCloudActual.cuit} · Estados Contables en Moneda Homogénea (RT 54 FACPCE - IPC ${coefInflacionAnualIpc}%)`,
                          ['Estado Contable / Rubro Oficial ARCA', 'Norma / Anexo', 'Importe Cierre ($ ARS)'],
                          [
                            ['--- I. ESTADO DE SITUACIÓN PATRIMONIAL (ACTIVO) ---', 'RT 54 FACPCE / RG 5908', ''],
                            ['1.1 Caja y Bancos (Nota 12.1)', 'Activo Corriente', `$${rt54Mapped.estadopat.cajaYBancosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['1.2 Cuentas por Cobrar a Clientes en Moneda (Nota 12.3)', 'Activo Corriente', `$${rt54Mapped.estadopat.cuentasPorCobrarClientesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['1.3 Créditos Impositivos (Nota 12.5)', 'Activo Corriente', `$${rt54Mapped.estadopat.creditosImpositivosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['1.4 Bienes de Cambio (Nota 12.12)', 'Activo Corriente', `$${rt54Mapped.estadopat.bienesDeCambioActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['1.5 Bienes de Uso Netos (Anexo III - Bsuso!O19)', 'Activo No Corriente', `$${rt54Mapped.estadopat.bienesDeUsoNetosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['TOTAL DEL ACTIVO (estadopat!B39)', 'Suma Activo Corriente + No Corriente', `$${rt54Mapped.estadopat.totalActivoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['--- II. ESTADO DE SITUACIÓN PATRIMONIAL (PASIVO Y P. NETO) ---', 'RT 54 FACPCE / RG 5908', ''],
                            ['2.1 Proveedores de Bienes y Servicios (Nota 12.13)', 'Pasivo Corriente', `$${rt54Mapped.estadopat.proveedoresActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['2.2 Deudas Fiscales (Nota 12.16: IVA + IIBB + Ganancias F.713)', 'Pasivo Corriente', `$${rt54Mapped.estadopat.deudasFiscalesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['2.3 Deudas Laborales y Previsionales (Nota 12.15: Sueldos + F.931)', 'Pasivo Corriente', `$${rt54Mapped.estadopat.deudasLaboralesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['TOTAL DEL PASIVO (estadopat!E37)', 'Pasivo Exigible', `$${rt54Mapped.estadopat.totalPasivoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['3.1 Capital Social Suscripto (EEPN!B20)', 'Patrimonio Neto', `$${rt54Mapped.eepn.capitalSuscripto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['3.2 Ajuste de Capital y Reserva Legal (EEPN!C20+G20)', 'Patrimonio Neto', `$${(rt54Mapped.eepn.ajusteCapital + rt54Mapped.eepn.reservaLegal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['3.3 Resultados Acumulados + Resultado del Ejercicio (EEPN!K20)', 'Patrimonio Neto', `$${(rt54Mapped.eepn.resultadosNoAsignadosInicio + rt54Mapped.eepn.resultadoEjercicio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['TOTAL PATRIMONIO NETO (estadopat!E38)', 'Activo - Pasivo', `$${rt54Mapped.estadopat.patrimonioNetoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['--- III. ESTADO DE RESULTADOS (EstRes) Y ANEXOS VIII / IX ---', 'RT 54 / RG 5908 ARCA', ''],
                            ['Ingresos Netos por Ventas y Servicios (Nota 12.27)', 'EstRes!C6', `$${rt54Mapped.estRes.ventasNetasActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(-) Costo de Bienes Vendidos y Servicios Prestados (Anexo VIII)', 'EstRes!C9', `$${rt54Mapped.estRes.costoVentasYServiciosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(=) Resultado Bruto (EstRes!C11)', 'EstRes!C11', `$${rt54Mapped.estRes.resultadoBrutoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(-) Gastos de Comercialización (Anexo IX Col. D)', 'EstRes!C14', `$${rt54Mapped.estRes.gastosComercializacionActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(-) Gastos de Administración (Anexo IX Col. E)', 'EstRes!C15', `$${rt54Mapped.estRes.gastosAdministracionActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(+/-) Resultados Financieros y por Tenencia inc. RECPAM (Nota 12.24)', 'EstRes!C21', `$${rt54Mapped.estRes.recpamYFinancierosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(=) Resultado antes de Impuesto a las Ganancias', 'EstRes!C25', `$${rt54Mapped.estRes.resultadoAntesImpuestoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(-) Impuesto a las Ganancias F.713 (Nota 12.16)', 'EstRes!C26', `$${rt54Mapped.estRes.impuestoGananciasActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                            ['(=) RESULTADO FINAL DEL EJERCICIO (EstRes!C32)', 'Memoria y Balance PUB', `$${rt54Mapped.estRes.resultadoEjercicioActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`]
                          ]
                        )
                      }
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#042f22] border-2 border-[#064e3b] font-extrabold uppercase flex items-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Descargar PDF Único PUB (RG 4626) + F.713</span>
                    </button>
                  </div>
                </div>

                {/* Parámetros Editables de Carátula (Hoja 2), Controles (Hoja 1) y Valuación RT 54 */}
                <div className="p-4 bg-slate-50 border border-slate-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-800 uppercase">
                      ⚙ PARÁMETROS DE CARÁTULA SOCIETARIA (HOJA 2: Caratula), CONTROLES (HOJA 1: Controles) Y VALUACIÓN RT 54
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold">
                      Al modificar cualquier campo se recalculan en vivo las 22 pestañas del archivo RT54.xlsx
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Domicilio Legal (Caratula!B5):
                      </label>
                      <input
                        type="text"
                        value={rt54DomicilioLegal}
                        onChange={(e) => setRt54DomicilioLegal(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Inscripción R.P.C. / DPJ (Caratula!B10):
                      </label>
                      <input
                        type="text"
                        value={rt54RpcInscripcion}
                        onChange={(e) => setRt54RpcInscripcion(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Ejercicio Económico Nº (Caratula!B16):
                      </label>
                      <input
                        type="text"
                        value={rt54EjercicioNro}
                        onChange={(e) => setRt54EjercicioNro(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="block text-[9px] text-slate-600 font-bold mb-1">
                          Inicio (D17):
                        </label>
                        <input
                          type="date"
                          value={rt54FechaInicio}
                          onChange={(e) => setRt54FechaInicio(e.target.value)}
                          className="w-full px-1 py-1.5 bg-white border border-slate-300 text-[10px] font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-600 font-bold mb-1">
                          Cierre (D18):
                        </label>
                        <input
                          type="date"
                          value={rt54FechaCierre}
                          onChange={(e) => setRt54FechaCierre(e.target.value)}
                          className="w-full px-1 py-1.5 bg-white border border-slate-300 text-[10px] font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-600 font-bold mb-1">
                          Informe (B32):
                        </label>
                        <input
                          type="date"
                          value={rt54FechaInforme}
                          onChange={(e) => setRt54FechaInforme(e.target.value)}
                          className="w-full px-1 py-1.5 bg-white border border-slate-300 text-[10px] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Modelo EEPN (Controles!B4):
                      </label>
                      <select
                        value={rt54ModeloEepn}
                        onChange={(e) => setRt54ModeloEepn(e.target.value as 'EEPN (1)' | 'EEPN (2)')}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold text-[#042f22]"
                      >
                        <option value="EEPN (1)">EEPN (1)</option>
                        <option value="EEPN (2)">EEPN (2)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Modelo Prop. Inv. (B3):
                      </label>
                      <select
                        value={rt54ModeloPi}
                        onChange={(e) => setRt54ModeloPi(e.target.value as 'Costo' | 'Valor Razonable')}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold text-[#042f22]"
                      >
                        <option value="Costo">Costo (Anexo VI)</option>
                        <option value="Valor Razonable">Valor Razonable (Anexo V)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Variación IPC (%):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={coefInflacionAnualIpc}
                        onChange={(e) => setCoefInflacionAnualIpc(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold text-[#042f22]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Bienes de Uso Netos ($):
                      </label>
                      <input
                        type="number"
                        value={bienesDeUsoNetos}
                        onChange={(e) => setBienesDeUsoNetos(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Deprec. Ejercicio Bs.Uso ($):
                      </label>
                      <input
                        type="number"
                        value={rt54DepEjercicioBsUso}
                        onChange={(e) => setRt54DepEjercicioBsUso(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Capital Suscripto ($):
                      </label>
                      <input
                        type="number"
                        value={capitalSocialHistorico}
                        onChange={(e) => setCapitalSocialHistorico(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-1">
                        Anticipos Ganancias ($):
                      </label>
                      <input
                        type="number"
                        value={anticiposGananciasPagados}
                        onChange={(e) => setAnticiposGananciasPagados(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Dos Columnas Principales: 1) Estado de Situación Patrimonial (estadopat) | 2) Estado de Resultados (EstRes) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h5 className="font-extrabold text-slate-900 uppercase">
                        1. HOJA 3 (estadopat): ESTADO DE SITUACIÓN PATRIMONIAL RT 54
                      </h5>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#042f22] font-extrabold text-[10px]">
                        ✔ ACTIVO = PASIVO+PN
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase pt-1">ACTIVO CORRIENTE Y NO CORRIENTE (ACTUAL vs ANTERIOR)</div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Caja y Bancos (Nota 12.1 → <code>estadopat!B8</code>):</span>
                      <span className="font-bold">${rt54Mapped.estadopat.cajaYBancosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Cuentas por cobrar a clientes en moneda (Nota 12.3 → <code>estadopat!B10</code>):</span>
                      <span className="font-bold">${rt54Mapped.estadopat.cuentasPorCobrarClientesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Créditos impositivos (Nota 12.5 → <code>estadopat!B12</code>):</span>
                      <span className="font-bold">${rt54Mapped.estadopat.creditosImpositivosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Bienes de Cambio (Nota 12.12 → <code>estadopat!B16</code>):</span>
                      <span className="font-bold">${rt54Mapped.estadopat.bienesDeCambioActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Bienes de Uso Netos (Anexo III → <code>estadopat!B29</code>):</span>
                      <span className="font-bold">${rt54Mapped.estadopat.bienesDeUsoNetosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                      <span>TOTAL DEL ACTIVO (<code>estadopat!B39</code>):</span>
                      <span>${rt54Mapped.estadopat.totalActivoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="text-[11px] font-bold text-rose-800 uppercase pt-2">PASIVO Y PATRIMONIO NETO</div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Proveedores de bienes y servicios (Nota 12.13 → <code>estadopat!E8</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estadopat.proveedoresActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Deudas fiscales (Nota 12.16: IVA + IIBB + Ganancias → <code>estadopat!E10</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estadopat.deudasFiscalesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Deudas laborales y previsionales (Nota 12.15: Sueldos + F.931 → <code>estadopat!E11</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estadopat.deudasLaboralesActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 font-bold">
                      <span>TOTAL DEL PASIVO (<code>estadopat!E37</code>):</span>
                      <span>${rt54Mapped.estadopat.totalPasivoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 font-bold text-slate-800">
                      <span>PATRIMONIO NETO SEGÚN EEPN (<code>estadopat!E38</code>):</span>
                      <span>${rt54Mapped.estadopat.patrimonioNetoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-slate-100 px-2 font-extrabold text-slate-900">
                      <span>TOTAL PASIVO + PATRIMONIO NETO (<code>estadopat!E39</code>):</span>
                      <span>${rt54Mapped.estadopat.totalPasivoMasPnActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <h5 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
                      2. HOJA 4 (EstRes): ESTADO DE RESULTADOS RT 54 + IMPUESTO A LAS GANANCIAS
                    </h5>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+) Ingresos netos por ventas y servicios (Nota 12.27 → <code>EstRes!C6</code>):</span>
                      <span className="font-bold text-emerald-700">${rt54Mapped.estRes.ventasNetasActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Costo de bienes vendidos y servicios prestados (Anexo VIII → <code>EstRes!C9</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estRes.costoVentasYServiciosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 font-bold bg-slate-50 px-1">
                      <span>(=) RESULTADO BRUTO (<code>EstRes!C11</code>):</span>
                      <span>${rt54Mapped.estRes.resultadoBrutoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Gastos de comercialización (Anexo IX Col. D → <code>EstRes!C14</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estRes.gastosComercializacionActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Gastos de administración (Anexo IX Col. E → <code>EstRes!C15</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estRes.gastosAdministracionActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+/-) Otros resultados financieros y por tenencia inc. RECPAM (Nota 12.24 → <code>EstRes!C21</code>):</span>
                      <span className="font-bold text-indigo-800">${rt54Mapped.estRes.recpamYFinancierosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-indigo-50 px-2 font-extrabold text-indigo-950">
                      <span>(=) RESULTADO ANTES DE IMPUESTO A LAS GANANCIAS (<code>EstRes!C25</code>):</span>
                      <span>${rt54Mapped.estRes.resultadoAntesImpuestoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Impuesto a las Ganancias F.713 (Nota 12.16 → <code>EstRes!C26</code>):</span>
                      <span className="font-bold text-rose-700">${rt54Mapped.estRes.impuestoGananciasActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                      <span>(=) RESULTADO DEL EJERCICIO (<code>EstRes!C32</code> → <code>EEPN(1)!L19</code>):</span>
                      <span>${rt54Mapped.estRes.resultadoEjercicioActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* INSPECTOR DETALLADO DE MAPEO DE LAS 22 HOJAS DEL LIBRO RT54.XLSX */}
                <div className="border border-slate-300 bg-white">
                  <div className="p-3 bg-slate-100 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 uppercase">
                      AUDITORÍA DE MAPEO DIRECTO A LAS 22 PESTAÑAS DEL ARCHIVO RT54.XLSX
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRt54VistaInspector('notas_22')}
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border ${
                          rt54VistaInspector === 'notas_22'
                            ? 'bg-[#064e3b] text-white border-[#064e3b]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Hoja 22: Notas(2) (12.1 a 12.27)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRt54VistaInspector('anexo_ix_gastos')}
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border ${
                          rt54VistaInspector === 'anexo_ix_gastos'
                            ? 'bg-[#064e3b] text-white border-[#064e3b]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Hoja 18: Anexo IX Costos y Gastos
                      </button>
                      <button
                        type="button"
                        onClick={() => setRt54VistaInspector('anexo_viii_cmv')}
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border ${
                          rt54VistaInspector === 'anexo_viii_cmv'
                            ? 'bg-[#064e3b] text-white border-[#064e3b]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Hoja 17: Anexo VIII Costo de Venta
                      </button>
                      <button
                        type="button"
                        onClick={() => setRt54VistaInspector('eepn_efe')}
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase border ${
                          rt54VistaInspector === 'eepn_efe'
                            ? 'bg-[#064e3b] text-white border-[#064e3b]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Hojas 5, 7, 8, 9 y 12: EEPN + EFE + Bs.Uso
                      </button>
                    </div>
                  </div>

                  {rt54VistaInspector === 'notas_22' && (
                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-[10px] uppercase text-slate-600">
                            <th className="p-2">Nota RT 54</th>
                            <th className="p-2">Rubro y Desglose de Celdas en Hoja &apos;Notas(2)&apos;</th>
                            <th className="p-2">Módulo Origen Zonda ERP / Cloud</th>
                            <th className="p-2">Celda Destino EECC</th>
                            <th className="p-2 text-right">Actual ($)</th>
                            <th className="p-2 text-right">Anterior ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {rt54Mapped.notasPreview.map((n) => (
                            <tr key={n.notaCodigo} className="hover:bg-slate-50/80">
                              <td className="p-2 font-extrabold text-[#042f22] whitespace-nowrap">
                                {n.notaCodigo}
                              </td>
                              <td className="p-2">
                                <div className="font-bold text-slate-900">{n.titulo}</div>
                                <div className="space-y-0.5 mt-1">
                                  {n.detalleLineas.map((dl) => (
                                    <div
                                      key={dl.celda}
                                      className="text-[10px] text-slate-600 flex items-center justify-between bg-slate-50 px-1.5 py-0.5 border border-slate-200"
                                    >
                                      <span>
                                        <code>{dl.celda}</code> · {dl.concepto}
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        ${dl.actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-2 text-[11px] font-bold text-slate-700">
                                {n.moduloOrigenErp}
                              </td>
                              <td className="p-2 text-[11px] text-emerald-800 font-bold">
                                <code>{n.destinoEstado}</code>
                              </td>
                              <td className="p-2 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                ${n.actualCorriente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right text-slate-600 whitespace-nowrap">
                                ${n.anteriorCorriente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rt54VistaInspector === 'anexo_ix_gastos' && (
                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-[10px] uppercase text-slate-600">
                            <th className="p-2">Fila Excel</th>
                            <th className="p-2">Rubro (Hoja 18: &apos;costos y gastos&apos; - Art. 64 Ley 19.550)</th>
                            <th className="p-2 text-right">Col. B: Costo Prod.</th>
                            <th className="p-2 text-right">Col. C: Prest. Serv.</th>
                            <th className="p-2 text-right">Col. D: Comercializ.</th>
                            <th className="p-2 text-right">Col. E: Administrac.</th>
                            <th className="p-2 text-right">Col. G: Total Actual</th>
                            <th className="p-2 text-right">Col. H: Total Anterior</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {rt54Mapped.anexoIXPreview.map((row) => (
                            <tr key={row.fila} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-500">Fila {row.fila}</td>
                              <td className="p-2 font-bold text-slate-900">{row.rubro}</td>
                              <td className="p-2 text-right">
                                ${row.costoProduccionB.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right">
                                ${row.gastosServiciosC.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right">
                                ${row.gastosComercializacionD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right">
                                ${row.gastosAdministracionE.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-extrabold text-[#042f22]">
                                ${row.totalActualG.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right text-slate-500">
                                ${row.totalAnteriorH.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rt54VistaInspector === 'anexo_viii_cmv' && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-3 space-y-2">
                        <h6 className="font-extrabold text-[#042f22] uppercase border-b border-slate-200 pb-1">
                          HOJA 17 (&apos;costo de venta&apos;): ANEXO VIII DETERMINACIÓN DEL CMV Y SERVICIOS
                        </h6>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Existencia Inicial de Bienes de Cambio (<code>C8 = +D22</code>):</span>
                          <span className="font-bold">${rt54Mapped.costoVentaAnexoVIII.existenciaInicialActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>(+) Costos de Producción s/ Anexo IX (<code>C13 = &apos;costos y gastos&apos;!B38</code>):</span>
                          <span className="font-bold">${rt54Mapped.costoVentaAnexoVIII.costosProduccionActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>(+) Compras del Ejercicio (<code>C16</code>):</span>
                          <span className="font-bold">${rt54Mapped.costoVentaAnexoVIII.comprasActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>(-) Existencia Final s/ Nota 12.12 (<code>C22 = &apos;Notas(2)&apos;!B145</code>):</span>
                          <span className="font-bold text-emerald-700">-${rt54Mapped.costoVentaAnexoVIII.existenciaFinalActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 font-bold">
                          <span>(=) Costo de los Bienes Vendidos (<code>C25</code>):</span>
                          <span>${rt54Mapped.costoVentaAnexoVIII.costoBienesVendidosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span>(+) Gastos por Prestación de Servicios s/ Anexo IX (<code>C26 = &apos;costos y gastos&apos;!C38</code>):</span>
                          <span className="font-bold">${rt54Mapped.costoVentaAnexoVIII.gastosPrestacionServiciosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1.5 bg-rose-50 px-2 font-extrabold text-rose-900">
                          <span>(=) TOTAL COSTO BIENES VENDIDOS Y SERVICIOS (<code>C27 → EstRes!C9</code>):</span>
                          <span>${rt54Mapped.costoVentaAnexoVIII.costoTotalVentasYServiciosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3 space-y-2 bg-slate-50">
                        <h6 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-1">
                          INTERCONEXIÓN AUTOMÁTICA DE FÓRMULAS EXCEL
                        </h6>
                        <p className="text-[11px] font-sans text-slate-700 leading-relaxed">
                          En el archivo oficial <code>RT54.xlsx</code>, la celda <code>EstRes!C9</code> tiene la fórmula <code>=-&apos;costo de venta&apos;!C27</code>. A su vez, <code>&apos;costo de venta&apos;!C27</code> suma el Costo de Bienes Vendidos (<code>C25</code>) más los Gastos por Prestación de Servicios provenientes de <code>&apos;costos y gastos&apos;!C38</code>, y descuenta automáticamente la Existencia Final de <code>&apos;Notas(2)&apos;!B145</code> (alimentada por el módulo <strong>06 - Inventario</strong>).
                        </p>
                      </div>
                    </div>
                  )}

                  {rt54VistaInspector === 'eepn_efe' && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-3 space-y-2">
                        <h6 className="font-extrabold text-[#042f22] uppercase border-b border-slate-200 pb-1">
                          HOJAS 5 Y 6 (EEPN 1 Y 2): EVOLUCIÓN DEL PATRIMONIO NETO
                        </h6>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Capital Social Suscripto (<code>EEPN(1)!B10 → B20</code>):</span>
                          <span className="font-bold">${rt54Mapped.eepn.capitalSuscripto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Ajuste Integral del Capital RT 6 (<code>EEPN(1)!C10 → C20</code>):</span>
                          <span className="font-bold">${rt54Mapped.eepn.ajusteCapital.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Reserva Legal (<code>EEPN(1)!G10 → G20</code>):</span>
                          <span className="font-bold">${rt54Mapped.eepn.reservaLegal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Resultados No Asignados al Inicio (<code>EEPN(1)!I10 → I20</code>):</span>
                          <span className="font-bold">${rt54Mapped.eepn.resultadosNoAsignadosInicio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>(+) Resultado del Ejercicio (<code>EEPN(1)!L19 = +EstRes!C32</code>):</span>
                          <span className="font-bold text-emerald-700">${rt54Mapped.eepn.resultadoEjercicio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                          <span>(=) SALDO CIERRE PATRIMONIO NETO (<code>EEPN(1)!L20 → estadopat!E38</code>):</span>
                          <span>${rt54Mapped.eepn.totalPnCierreActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3 space-y-2">
                        <h6 className="font-extrabold text-[#042f22] uppercase border-b border-slate-200 pb-1">
                          HOJAS 7, 8, 9 (EFE SINTÉTICO / DIRECTO / INDIRECTO) Y HOJA 12 (BS. USO)
                        </h6>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Efectivo al Inicio del Ejercicio (<code>&apos;Notas(2)&apos;!C286</code>):</span>
                          <span className="font-bold">${rt54Mapped.estadopat.cajaYBancosAnterior.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Efectivo al Cierre del Ejercicio (<code>&apos;Notas(2)&apos;!B286</code>):</span>
                          <span className="font-bold">${rt54Mapped.estadopat.cajaYBancosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-emerald-800">
                          <span>(=) Variación Neta del Efectivo (<code>EFE!C12 / C27 / C54 / C80</code>):</span>
                          <span>
                            ${(rt54Mapped.estadopat.cajaYBancosActual - rt54Mapped.estadopat.cajaYBancosAnterior).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Bienes de Uso Netos al Cierre (<code>Bsuso!O19 → estadopat!B29</code>):</span>
                          <span className="font-bold">${rt54Mapped.estadopat.bienesDeUsoNetosActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {subTabCloud === 'bitacora' && (
              <div className="space-y-3 font-mono text-xs">
                <h4 className="font-bold text-slate-900 uppercase">
                  BITÁCORA DE AUDITORÍA Y CONSENTIMIENTO DELEGADO (ZONDA ERP ↔ ZONDA CLOUD)
                </h4>
                <div className="border border-slate-300 divide-y divide-slate-200">
                  {authCloud.bitacoraCloud.length > 0 ? (
                    authCloud.bitacoraCloud.map((ev) => (
                      <div key={ev.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#064e3b] block">{ev.accion}</span>
                          <span className="text-[11px] text-slate-600 font-sans">{ev.detalle}</span>
                        </div>
                        <div className="text-right text-[10px] text-slate-500">
                          <span className="block font-bold text-slate-700">{ev.actor}</span>
                          <span>{ev.fechaHora}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400">Sin eventos registrados.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ALTA DE NUEVA EMPRESA (TENANT AISLADO) */}
      {showNuevoTenantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                ALTA DE NUEVA EMPRESA (TENANT MULTI-CUIT AISLADO)
              </h3>
              <button onClick={() => setShowNuevoTenantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoTenant} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Razón Social Oficial (ARCA):</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CONSTRUCTORA DEL SOL S.R.L."
                  value={ntRazonSocial}
                  onChange={(e) => setNtRazonSocial(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nombre de Fantasía:</label>
                  <input
                    type="text"
                    placeholder="Ej: Constructora Del Sol"
                    value={ntFantasia}
                    onChange={(e) => setNtFantasia(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CUIT:</label>
                  <input
                    type="text"
                    required
                    value={ntCuit}
                    onChange={(e) => setNtCuit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Condición frente al IVA:</label>
                  <select
                    value={ntCondIva}
                    onChange={(e) => setNtCondIva(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Responsable Monotributo</option>
                    <option value="Exento">Sujeto Exento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jurisdicción IIBB:</label>
                  <input
                    type="text"
                    value={ntJurisdiccion}
                    onChange={(e) => setNtJurisdiccion(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Actividad Principal (F.883 ARCA):</label>
                <input
                  type="text"
                  value={ntActividad}
                  onChange={(e) => setNtActividad(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ntAutorizarCloud}
                  onChange={(e) => setNtAutorizarCloud(e.target.checked)}
                />
                <span className="text-[11px] font-bold text-[#042f22]">
                  Autorizar desde el inicio la vinculación con Zonda Cloud para gestión de Compras, Ventas e Impuestos ARCA
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevoTenantModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Crear Empresa Aislada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGAR COMPRA O VENTA FISCAL DESDE ZONDA CLOUD */}
      {showCargaFiscalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                IMPUTAR COMPROBANTE EN {tenantCloudActual.razonSocial} (DESDE ZONDA CLOUD)
              </h3>
              <button onClick={() => setShowCargaFiscalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarComprobanteFiscal} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subdiario / Libro IVA:</label>
                  <select
                    value={cfFlujo}
                    onChange={(e) => setCfFlujo(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-400 font-bold text-[#042f22]"
                  >
                    <option value="COMPRA">Libro IVA Compras (Crédito Fiscal)</option>
                    <option value="VENTA">Libro IVA Ventas (Débito Fiscal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Comprobante:</label>
                  <select
                    value={cfTipo}
                    onChange={(e) => setCfTipo(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  >
                    <option value="Factura A">Factura A (001)</option>
                    <option value="Factura B">Factura B (006)</option>
                    <option value="Factura C">Factura C (011)</option>
                    <option value="Nota de Débito">Nota de Débito A (002)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Punto Venta:</label>
                  <input
                    type="text"
                    value={cfPtoVta}
                    onChange={(e) => setCfPtoVta(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Número:</label>
                  <input
                    type="text"
                    value={cfNumero}
                    onChange={(e) => setCfNumero(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={cfFecha}
                    onChange={(e) => setCfFecha(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              {/* Selector rápido de Cliente o Proveedor existente del Tenant para garantizar asociación */}
              <div className="p-2.5 bg-[#f0fdf4] border border-[#064e3b] space-y-1">
                <label className="block text-[10px] font-extrabold text-[#042f22] uppercase">
                  Seleccionar {cfFlujo === 'COMPRA' ? 'Proveedor' : 'Cliente'} del Padrón (o completar abajo si es nuevo):
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const idElegido = e.target.value;
                    if (!idElegido) return;
                    if (cfFlujo === 'COMPRA') {
                      const prv = snapTenant.proveedores.find((p) => p.id === idElegido);
                      if (prv) {
                        setCfCuit(prv.cuit);
                        setCfRazonSocial(prv.razonSocial);
                      }
                    } else {
                      const cli = snapTenant.clientes.find((c) => c.id === idElegido);
                      if (cli) {
                        setCfCuit(cli.cuit);
                        setCfRazonSocial(cli.razonSocial);
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-400 font-bold text-[#042f22] text-[11px]"
                >
                  <option value="">
                    -- Elegir {cfFlujo === 'COMPRA' ? 'Proveedor' : 'Cliente'} existente de {tenantCloudActual.razonSocial} --
                  </option>
                  {cfFlujo === 'COMPRA'
                    ? snapTenant.proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razonSocial} (CUIT: {p.cuit})
                        </option>
                      ))
                    : snapTenant.clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.razonSocial} (CUIT: {c.cuit})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CUIT Contraparte:</label>
                  <input
                    type="text"
                    required
                    value={cfCuit}
                    onChange={(e) => setCfCuit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Razón Social Contraparte:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Proveedor o Cliente"
                    value={cfRazonSocial}
                    onChange={(e) => setCfRazonSocial(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Neto Gravado ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cfNeto}
                    onChange={(e) => setCfNeto(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alícuota IVA:</label>
                  <select
                    value={cfAlicuota}
                    onChange={(e) => setCfAlicuota(Number(e.target.value) as 21 | 10.5 | 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold"
                  >
                    <option value={21}>21% (General)</option>
                    <option value={10.5}>10.5% (Reducida)</option>
                    <option value={0}>0% / Exento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Percepción IVA ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cfPercIva}
                    onChange={(e) => setCfPercIva(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Percepción IIBB ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cfPercIibb}
                    onChange={(e) => setCfPercIibb(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              {cfFlujo === 'COMPRA' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-700 font-bold mb-1">
                      Computabilidad IVA (Art. 12/13):
                    </label>
                    <select
                      value={cfComputabilidad}
                      onChange={(e) => setCfComputabilidad(e.target.value as any)}
                      className="w-full p-1 bg-white border border-slate-300 text-[11px]"
                    >
                      <option value="COMPUTABLE_100">100% Computable</option>
                      <option value="PRORRATEO_ART_13">Prorrateo Art. 13</option>
                      <option value="NO_COMPUTABLE">No Computable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-700 font-bold mb-1">
                      Rubro F.2002 ARCA:
                    </label>
                    <select
                      value={cfRubro}
                      onChange={(e) => setCfRubro(e.target.value as any)}
                      className="w-full p-1 bg-white border border-slate-300 text-[11px]"
                    >
                      <option value="BIENES_DE_CAMBIO">Bienes de Cambio</option>
                      <option value="BIENES_DE_USO">Bienes de Uso</option>
                      <option value="SERVICIOS_Y_GASTOS">Servicios y Gastos</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCargaFiscalModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Imputar en el ERP del Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
