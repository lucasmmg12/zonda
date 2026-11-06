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

        {/* GRILLA SELECTORA DE EMPRESAS (TENANTS AISLADOS) */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-700 uppercase">
              Seleccioná la Empresa (Tenant) a Auditar en Zonda Cloud o Activar en Zonda ERP:
            </span>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
              Aislamiento Multi-Tenant RLS: {tenants.length} Empresas Independientes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tenants.map((t) => {
              const isSelectedCloud = t.tenantId === tenantCloudActual.tenantId;
              const isErpActive = t.tenantId === activeTenantId;
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
                          <span>AUTORIZADO EN ZONDA CLOUD</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>ACCESO CLOUD SIN AUTORIZAR</span>
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
                        {t.usuariosInternos.length} usuarios propios aislados
                      </span>
                      <span>{t.jurisdiccionPrincipal.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {isErpActive ? (
                      <span className="text-[10px] font-mono font-bold text-[#064e3b] bg-white px-2 py-1 border border-emerald-300">
                        ● Activo ahora en Zonda ERP
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cambiarTenantActivo(t.tenantId);
                          setSelectedCloudTenantId(t.tenantId);
                          setAvisoOperacion(
                            `✓ Cambiaste el entorno activo de Zonda ERP a "${t.razonSocial}" (CUIT ${t.cuit}). Todos los módulos muestran ahora únicamente los datos aislados de esta empresa.`
                          );
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-700 hover:text-white text-[#064e3b] border border-[#064e3b] text-[10px] font-mono font-bold uppercase transition-colors"
                      >
                        Abrir este Tenant en Zonda ERP
                      </button>
                    )}

                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {isSelectedCloud ? 'Viendo en Cloud ▼' : 'Seleccionar'}
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
            PROTECCIÓN DE PRIVACIDAD MULTI-TENANT // ACCESO DELEGADO REQUERIDO
          </div>
          <h3 className="text-base font-extrabold text-slate-900 uppercase">
            El usuario titular de &ldquo;{tenantCloudActual.razonSocial}&rdquo; ({tenantCloudActual.cuit}) aún no autorizó el acceso a Zonda Cloud
          </h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            Por seguridad tributaria y aislamiento Multi-Tenant, <strong>Zonda Cloud no puede leer ni modificar Compras, Ventas ni Impuestos</strong> de una empresa sin la autorización expresa del administrador de su Zonda ERP.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                actualizarAutorizacionZondaCloud(
                  tenantCloudActual.tenantId,
                  {
                    autorizado: true,
                    fechaAutorizacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    tokenVinculacion: `ZCLOUD-ARCA-${tenantCloudActual.cuit.replace(/\D/g, '')}-OK`,
                    autorizadoPorUsuarioErp:
                      tenantCloudActual.usuariosInternos[0]?.nombre || 'Titular Zonda ERP'
                  },
                  {
                    actor: `Usuario Zonda ERP (${tenantCloudActual.razonSocial})`,
                    accion: 'OTORGAMIENTO DE AUTORIZACIÓN A ZONDA CLOUD',
                    detalle: 'Se habilitó la gestión de Compras, Ventas y Liquidación de Impuestos ARCA.'
                  }
                );
                setAvisoOperacion(
                  `✓ Autorización concedida por el usuario de Zonda ERP de "${tenantCloudActual.razonSocial}". Ahora Zonda Cloud puede gestionar sus Compras, Ventas e Impuestos ARCA.`
                );
              }}
              className="px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-mono font-bold uppercase flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Autorizar Acceso desde Zonda ERP Ahora (Simular Consentimiento del Cliente)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                cambiarTenantActivo(tenantCloudActual.tenantId);
                setActiveModule('configuracion');
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-mono font-bold uppercase"
            >
              Ir a Configuración Fiscal del Cliente (Módulo 09)
            </button>
          </div>
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
                {/* Encabezado y Botón de Exportación PDF Único para Presentación Única de Balances (PUB RG 4626) */}
                <div className="p-4 bg-[#f0fdf4] border-2 border-[#064e3b] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#064e3b] text-white text-[10px] font-extrabold uppercase">
                        RG 4626 (PUB) + RG 5908/2026 (F. 713 WEB) + RT 54 FACPCE (NUA)
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-[#042f22] uppercase">
                      BALANCES Y ESTADOS CONTABLES PARA PRESENTAR EN ARCA — {tenantCloudActual.razonSocial}
                    </h4>
                    <p className="text-[11px] text-slate-700 font-sans max-w-3xl">
                      Genera en vivo los <strong>4 Estados Contables Básicos bajo RT 54 (NUA)</strong> reexpresados en moneda homogénea (<strong>RECPAM</strong>), la grilla de <strong>Rubros Resumidos del nuevo servicio web &ldquo;Ganancias Personas Jurídicas (RG 5908)&rdquo;</strong> y el <strong>Archivo PDF Único Consolidado</strong> exigido por el servicio web <strong>&ldquo;Presentación Única de Balances (PUB - RG 4626)&rdquo;</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      printFinancialReport(
                        `PRESENTACIÓN ÚNICA DE BALANCES (PUB - RG 4626 ARCA) y F. 713 (RG 5908)`,
                        `${tenantCloudActual.razonSocial} · CUIT ${tenantCloudActual.cuit} · Estados Contables en Moneda Homogénea (RT 54 FACPCE - IPC ${coefInflacionAnualIpc}%)`,
                        ['Estado Contable / Rubro Oficial ARCA', 'Norma / Anexo', 'Importe Cierre ($ ARS)'],
                        [
                          ['--- I. ESTADO DE SITUACIÓN PATRIMONIAL (ACTIVO) ---', 'RT 54 FACPCE / RG 5908', ''],
                          ['1.1 Caja y Bancos (Disponibilidades)', 'Activo Corriente', `$${liquidacionCalculada.cajaYBancos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['1.2 Créditos por Ventas (Clientes Cta. Cte.)', 'Activo Corriente', `$${liquidacionCalculada.creditosPorVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['1.3 Otros Créditos (Saldos Fiscales y Anticipos)', 'Activo Corriente', `$${liquidacionCalculada.otrosCreditosFiscales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['1.4 Bienes de Cambio (Inventario Valorizado)', 'Activo Corriente', `$${liquidacionCalculada.bienesDeCambio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['1.5 Bienes de Uso (Netos de Amortización)', 'Activo No Corriente', `$${liquidacionCalculada.totalActivoNoCorriente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['TOTAL DEL ACTIVO', 'Suma Activo Corriente + No Corriente', `$${liquidacionCalculada.totalActivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['--- II. ESTADO DE SITUACIÓN PATRIMONIAL (PASIVO Y P. NETO) ---', 'RT 54 FACPCE / RG 5908', ''],
                          ['2.1 Deudas Comerciales (Proveedores)', 'Pasivo Corriente', `$${liquidacionCalculada.deudasComercialesProveedores.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['2.2 Cargas Fiscales y Sociales (IVA, IIBB, F.931)', 'Pasivo Corriente', `$${liquidacionCalculada.deudasFiscalesYSociales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['TOTAL DEL PASIVO', 'Pasivo Exigible', `$${liquidacionCalculada.totalPasivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['3.1 Capital Social Suscripto', 'Patrimonio Neto', `$${capitalSocialHistorico.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['3.2 Ajuste de Capital y Reservas (RT 6 / RT 54)', 'Patrimonio Neto', `$${liquidacionCalculada.ajusteDeCapital.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['3.3 Resultado Neto del Ejercicio', 'Patrimonio Neto', `$${liquidacionCalculada.resultadoNetoDelEjercicio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['TOTAL PATRIMONIO NETO', 'Activo - Pasivo', `$${liquidacionCalculada.patrimonioNetoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['--- III. ESTADO DE RESULTADOS Y CONCILIACIÓN IMPOSITIVA F.713 ---', 'RG 5908 ARCA', ''],
                          ['Ventas Netas de Bienes y Servicios (Anualizadas)', 'Estado de Resultados', `$${liquidacionCalculada.ventasNetasAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['(-) Costo Operativo de Compras e Insumos', 'Estado de Resultados', `-$${liquidacionCalculada.cmvYGastosOperativosAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['(-) Gastos de Personal y Cargas Sociales (Sueldos)', 'Art. 64 Ley 19.550', `-$${liquidacionCalculada.gastosLaboralesAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['(+/-) RECPAM / Ajuste por Inflación (IPC ' + coefInflacionAnualIpc + '%)', 'RT 6 / LIG AXII', `$${liquidacionCalculada.recpamContable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['Resultado Impositivo Sujeto a Impuesto (F.713)', 'RG 5908 Columna II', `$${liquidacionCalculada.resultadoImpositivoGravadoF713.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['(-) Impuesto a las Ganancias Determinado (' + liquidacionCalculada.alicuotaMarginalAplicada + ')', 'Art. 73 LIG', `-$${liquidacionCalculada.impuestoGananciasDeterminado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
                          ['RESULTADO NETO FINAL DEL EJERCICIO', 'Memoria y Balance PUB', `$${liquidacionCalculada.resultadoNetoDelEjercicio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`]
                        ]
                      )
                    }
                    className="px-4 py-2.5 bg-[#064e3b] hover:bg-[#042f22] text-white font-extrabold uppercase flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF Único Oficial PUB (RG 4626) + F.713</span>
                  </button>
                </div>

                {/* Parámetros Editables del Balance Anual y Ajuste por Inflación */}
                <div className="p-4 bg-slate-50 border border-slate-300 grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold mb-1">
                      Variación Anual IPC / IPIM (%):
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
                      Capital Social Suscripto ($):
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
                      Gastos No Deducibles F.713 ($):
                    </label>
                    <input
                      type="number"
                      value={gastosNoDeduciblesImpositivos}
                      onChange={(e) => setGastosNoDeduciblesImpositivos(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold mb-1">
                      Anticipos y Ret. Ganancias ($):
                    </label>
                    <input
                      type="number"
                      value={anticiposGananciasPagados}
                      onChange={(e) => setAnticiposGananciasPagados(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                    />
                  </div>
                </div>

                {/* Dos Columnas: 1) Estado de Situación Patrimonial (Rubros RG 5908) | 2) Estado de Resultados + Conciliación Impositiva F.713 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <h5 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
                      1. ESTADO DE SITUACIÓN PATRIMONIAL (RUBROS RESUMIDOS RG 5908 WEB ARCA)
                    </h5>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase pt-1">ACTIVO CORRIENTE Y NO CORRIENTE</div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Caja y Bancos (Tesorería):</span>
                      <span className="font-bold">${liquidacionCalculada.cajaYBancos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Créditos por Ventas (Clientes Cta. Cte.):</span>
                      <span className="font-bold">${liquidacionCalculada.creditosPorVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Otros Créditos Fiscales (IVA / Anticipos):</span>
                      <span className="font-bold">${liquidacionCalculada.otrosCreditosFiscales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Bienes de Cambio (Inventario Valorizado):</span>
                      <span className="font-bold">${liquidacionCalculada.bienesDeCambio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Bienes de Uso (Propiedad, Planta y Equipo):</span>
                      <span className="font-bold">${liquidacionCalculada.totalActivoNoCorriente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                      <span>TOTAL DEL ACTIVO:</span>
                      <span>${liquidacionCalculada.totalActivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="text-[11px] font-bold text-rose-800 uppercase pt-2">PASIVO Y PATRIMONIO NETO</div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Deudas Comerciales (Proveedores Cta. Cte.):</span>
                      <span className="font-bold text-rose-700">${liquidacionCalculada.deudasComercialesProveedores.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Deudas Fiscales y Sociales (IVA + IIBB + F.931):</span>
                      <span className="font-bold text-rose-700">${liquidacionCalculada.deudasFiscalesYSociales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 font-bold">
                      <span>TOTAL DEL PASIVO:</span>
                      <span>${liquidacionCalculada.totalPasivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-slate-100 px-2 font-extrabold text-slate-900">
                      <span>PATRIMONIO NETO (Activo − Pasivo):</span>
                      <span>${liquidacionCalculada.patrimonioNetoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="border border-slate-300 p-4 space-y-2 bg-white">
                    <h5 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-2">
                      2. ESTADO DE RESULTADOS + AJUSTE POR INFLACIÓN Y F. 713 (RG 5908)
                    </h5>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+) Ventas Netas de Bienes y Servicios (Proyección Anual):</span>
                      <span className="font-bold text-emerald-700">${liquidacionCalculada.ventasNetasAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Costo de Ventas, Materiales y Servicios (Compras):</span>
                      <span className="font-bold text-rose-700">-${liquidacionCalculada.cmvYGastosOperativosAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Gastos Laborales y Cargas Sociales (Anexo Art. 64):</span>
                      <span className="font-bold text-rose-700">-${liquidacionCalculada.gastosLaboralesAnuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                      <span>(=) Resultado Operativo Antes de RECPAM:</span>
                      <span>${liquidacionCalculada.resultadoOperativoAntesRecpam.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+/-) RECPAM / Ajuste por Inflación Impositivo (IPC {coefInflacionAnualIpc}%):</span>
                      <span className="font-bold text-indigo-800">${liquidacionCalculada.recpamContable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(+) Ajustes Impositivos Columna II (Gastos No Deducibles):</span>
                      <span className="font-bold">+${gastosNoDeduciblesImpositivos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-indigo-50 px-2 font-extrabold text-indigo-950">
                      <span>(=) RESULTADO IMPOSITIVO GRAVADO (F. 713 WEB):</span>
                      <span>${liquidacionCalculada.resultadoImpositivoGravadoF713.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>(-) Impuesto a las Ganancias ({liquidacionCalculada.alicuotaMarginalAplicada}):</span>
                      <span className="font-bold text-rose-700">-${liquidacionCalculada.impuestoGananciasDeterminado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 bg-emerald-50 px-2 font-extrabold text-[#042f22]">
                      <span>(=) RESULTADO NETO DEL EJERCICIO (PUB RG 4626):</span>
                      <span>${liquidacionCalculada.resultadoNetoDelEjercicio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
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
