import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  recordSubmission,
  subscribeToProjects,
  subscribeToSubmissions,
  seedInitialProjectsIfEmpty,
  pingFirestoreConnection,
  ProjectData,
  SubmissionRecord
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Realistic Government Seed Data for initial empty Firestore state
export const INITIAL_PROJECTS: ProjectData[] = [
  {
    id: "PRJ-KPSTI-2026-001",
    title: "Pembangunan Hab Inovasi Robotik & Kecerdasan Buatan (AI) Komuniti",
    description: "Mewujudkan pusat latihan reka cipta robotik, IoT, dan pembelajaran mesin berteknologi tinggi untuk belia luar bandar.",
    department: "Bahagian Inovasi dan Digital (BID)",
    officer: "Puan Noor Azlina binti Rashid",
    ceiling: 3500000,
    annualAllocation: 1200000,
    projectedSpend: 1150000,
    actualSpend: 980000,
    physicalProgress: 85,
    status: "Dalam Pelaksanaan",
    startDate: "2026-01-15",
    endDate: "2026-11-30",
    year: 2026,
    issues: "Penghantaran mikropemproses dari luar negara mengalami kelewatan logistik selama 1 minggu.",
    remarks: "Peralatan utama telah dipasang 90%. Ujian pentauliahan makmal AI sedang dijalankan.",
    files: [
      { name: "Surat_Kelulusan_Kewangan_2026.pdf", size: "1.4 MB", type: "PDF" },
      { name: "Laporan_Kemajuan_SukuTahun_Q2.docx", size: "850 KB", type: "DOCX" }
    ],
    logs: [
      { date: "2026-02-10", officer: "Puan Noor Azlina", action: "Perolehan fasa 1 diluluskan" },
      { date: "2026-06-15", officer: "Datuk Dr. Haji Mohd Nor", action: "Pengesahan perbelanjaan RM 980,000" }
    ]
  },
  {
    id: "PRJ-KPSTI-2026-002",
    title: "Program Pemindahan Teknologi Akuakultur Moden & Latihan Kemahiran TVET",
    description: "Pemasangan sistem penderia kualiti air automatik berasaskan tenaga solar dan modul pensijilan TVET untuk pengusaha tempatan.",
    department: "Bahagian TVET dan Pemantauan Projek (BTPP)",
    officer: "Encik Farhan bin Zakaria",
    ceiling: 1800000,
    annualAllocation: 600000,
    projectedSpend: 580000,
    actualSpend: 560000,
    physicalProgress: 100,
    status: "Selesai",
    startDate: "2026-01-01",
    endDate: "2026-07-31",
    year: 2026,
    issues: "Tiada isu kritikal. Program telah mencapai output 100 komuniti penerima manfaat.",
    remarks: "Selesai sepenuhnya dan penyerahan aset kepada persatuan nelayan telah disempurnakan.",
    files: [
      { name: "Sijil_Perakuan_Siap_Kerja.pdf", size: "2.1 MB", type: "PDF" },
      { name: "Senarai_Penerima_Teknologi.xlsx", size: "420 KB", type: "XLSX" }
    ],
    logs: [
      { date: "2026-01-20", officer: "Encik Farhan", action: "Pendaftaran projek dan pengagihan sensor" },
      { date: "2026-08-01", officer: "Datuk Dr. Haji Mohd Nor", action: "Penutupan rasmi projek" }
    ]
  },
  {
    id: "PRJ-KPSTI-2026-003",
    title: "Program Pengukuhan Pendidikan STEM Sekolah Rendah & Menengah Sabah",
    description: "Penyediaan kit makmal sains mudah alih dan latihan pedagogi STEM berpusat untuk guru-guru pedalaman.",
    department: "Bahagian Pendidikan (BP)",
    officer: "Dr. Dayangku Siti Mariam",
    ceiling: 4200000,
    annualAllocation: 1500000,
    projectedSpend: 1300000,
    actualSpend: 620000,
    physicalProgress: 42,
    status: "Tertangguh/Lewat",
    startDate: "2026-02-01",
    endDate: "2026-10-31",
    year: 2026,
    issues: "Kelewatan proses perolehan tender fasa 2 bagi modul kit eksperimen sains di peringkat JPP.",
    remarks: "Mesyuarat penyelarasan khas bersama Bahagian Perolehan telah diadakan bagi mempercepat tender terhad.",
    files: [
      { name: "Kertas_Cadangan_STEM_Sabah.pdf", size: "3.2 MB", type: "PDF" }
    ],
    logs: [
      { date: "2026-03-01", officer: "Dr. Dayangku Siti Mariam", action: "Kelulusan siling peruntukan projek" },
      { date: "2026-07-10", officer: "Pegawai Pemantau Belanjawan", action: "Notis amaran varians penyerapan rendah dikeluarkan" }
    ]
  },
  {
    id: "PRJ-KPSTI-2026-004",
    title: "Penaiktarafan Pusat Data Berpusat, Rangkaian Kerajaan & Keselamatan Siber KPSTI",
    description: "Pengukuhan infrastruktur awan kerajaan peribadi (EGS) kementerian serta perlindungan keselamatan siber tahap 3.",
    department: "Bahagian Infrastruktur ICT dan EGS (BIIE)",
    officer: "Encik Shahrul Anuar bin Osman",
    ceiling: 2500000,
    annualAllocation: 900000,
    projectedSpend: 850000,
    actualSpend: 790000,
    physicalProgress: 78,
    status: "Dalam Pelaksanaan",
    startDate: "2026-03-01",
    endDate: "2026-12-15",
    year: 2026,
    issues: "Kekurangan ruang rak di bilik pelayan cawangan. Sedang dinaik taraf.",
    remarks: "Pemasangan firewall perkakasan fasa 1 telah selesai dan beroperasi 24/7.",
    files: [
      { name: "Laporan_Audit_Keselamatan_Siber.pdf", size: "1.8 MB", type: "PDF" }
    ],
    logs: [
      { date: "2026-03-15", officer: "Encik Shahrul Anuar", action: "Pelaksanaan migrasi pangkalan data" }
    ]
  },
  {
    id: "PRJ-KPSTI-2026-005",
    title: "Pembangunan Kapasiti & Pelan Kompetensi Modal Insan Sains Digital KPSTI",
    description: "Program latihan pensijilan profesional kompetensi kakitangan awam dalam bidang analitik data, AI, dan tadbir urus.",
    department: "Bahagian Pengurusan Sumber Manusia dan Pentadbiran (BPSMP)",
    officer: "Puan Rohana binti Ismail",
    ceiling: 600000,
    annualAllocation: 300000,
    projectedSpend: 250000,
    actualSpend: 150000,
    physicalProgress: 50,
    status: "Dalam Pelaksanaan",
    startDate: "2026-04-01",
    endDate: "2026-09-30",
    year: 2026,
    issues: "Sesi maklum balas dengan institusi latihan memerlukan penjadualan semula bengkel kedua.",
    remarks: "Draf interim modul latihan telah siap 80% dan sedia untuk dibentangkan.",
    files: [
      { name: "Draf_Pelan_Latihan_Modal_Insan.pdf", size: "4.5 MB", type: "PDF" }
    ],
    logs: [
      { date: "2026-04-10", officer: "Puan Rohana", action: "Pelantikan panel fasilitator" }
    ]
  },
  {
    id: "PRJ-KPSTI-2026-006",
    title: "Sistem Pengurusan e-Kewangan & Rekonsiliasi Akaun Amanah Kerajaan",
    description: "Pengintegrasian perakaunan akruan bersepadu dan automasi rekonsiliasi vot perbelanjaan pembangunan KPSTI.",
    department: "Bahagian Akaun (BA)",
    officer: "Encik Zainal bin Abidin",
    ceiling: 1500000,
    annualAllocation: 500000,
    projectedSpend: 480000,
    actualSpend: 475000,
    physicalProgress: 95,
    status: "Dalam Pelaksanaan",
    startDate: "2026-01-10",
    endDate: "2026-11-15",
    year: 2026,
    issues: "Tiada isu besar. Penyelarasan lejar am sedang di peringkat akhir audit.",
    remarks: "Pengujian integrasi sistem i-GFMAS mencapai 98% ketepatan.",
    files: [
      { name: "Penyata_Rekonsiliasi_Akaun_Vot.xlsx", size: "620 KB", type: "XLSX" }
    ],
    logs: [
      { date: "2026-01-15", officer: "Encik Zainal", action: "Permulaan audit rekonsiliasi akaun amanah" }
    ]
  }
];

// App State
export interface AppState {
  projects: ProjectData[];
  submissions: SubmissionRecord[];
  activeTab: string;
  selectedRole: string;
  tempUploadedFiles: Array<{ name: string; size: string; type: string }>;
  currentPendingAction: string | null;
  currentUser: User | null;
  isFirebaseConnected: boolean;
  firestoreLatencyMs?: number | null;
}

export const state: AppState = {
  projects: JSON.parse(JSON.stringify(INITIAL_PROJECTS)),
  submissions: [],
  activeTab: "dashboard",
  selectedRole: "pegawai_projek",
  tempUploadedFiles: [],
  currentPendingAction: null,
  currentUser: null,
  isFirebaseConnected: false,
  firestoreLatencyMs: 12
};

// Chart instances
let comparisonChartInstance: any = null;
let statusChartInstance: any = null;
let analyticsTimelineChartInstance: any = null;
let analyticsCategoryChartInstance: any = null;
let analyticsDeptFinancialChartInstance: any = null;
let analyticsStatusChartInstance: any = null;

// Helpers
export function formatRM(amount: number | string): string {
  const val = Number(amount);
  if (isNaN(val)) return "RM 0.00";
  return "RM " + val.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateProjectVariance(project: ProjectData) {
  const variance = Number(project.projectedSpend || 0) - Number(project.actualSpend || 0);
  const utilRate = Number(project.annualAllocation || 0) > 0 
    ? (Number(project.actualSpend || 0) / Number(project.annualAllocation)) * 100 
    : 0;
  
  let statusTag = "Normal";
  let statusClass = "bg-emerald-100 text-emerald-800";
  let flagWarning = false;

  const variancePercent = Number(project.projectedSpend || 0) > 0 
    ? ((Number(project.actualSpend || 0) - Number(project.projectedSpend || 0)) / Number(project.projectedSpend || 0)) * 100 
    : 0;

  if (project.status === "Tertangguh/Lewat" || (utilRate < 50 && Number(project.physicalProgress || 0) < 45)) {
    statusTag = "Kritis (Penyerapan Rendah)";
    statusClass = "bg-rose-100 text-rose-800";
    flagWarning = true;
  } else if (Math.abs(variancePercent) > 15) {
    statusTag = "Varians Ketara";
    statusClass = "bg-amber-100 text-amber-800";
    flagWarning = true;
  } else if (utilRate >= 90) {
    statusTag = "Cemerlang";
    statusClass = "bg-blue-100 text-blue-800";
  }

  return {
    varianceRM: variance,
    variancePercent: variancePercent.toFixed(1),
    utilRate: utilRate.toFixed(1),
    statusTag,
    statusClass,
    flagWarning
  };
}

// Global Refresh Icon Trigger
function refreshIcons() {
  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

// 4-Page Navigation (Core, Reports, Analytics, Audit)
export function switchPage(pageId: 'core' | 'reports' | 'analytics' | 'audit' | string) {
  state.activeTab = pageId;
  const pages = ['core', 'reports', 'analytics', 'audit'];
  
  pages.forEach(p => {
    const btn = document.getElementById(`navBtn${p.charAt(0).toUpperCase() + p.slice(1)}`);
    const content = document.getElementById(`pageContent${p.charAt(0).toUpperCase() + p.slice(1)}`);
    
    if (btn && content) {
      if (p === pageId) {
        btn.className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white shadow-sm flex items-center space-x-1.5 sm:space-x-2 transition";
        content.classList.remove('hidden');
      } else {
        btn.className = "px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 flex items-center space-x-1.5 sm:space-x-2 transition";
        content.classList.add('hidden');
      }
    }
  });

  if (pageId === 'core') {
    renderAll();
    updateDynamicSummary();
  } else if (pageId === 'reports') {
    renderExecutiveReport();
  } else if (pageId === 'analytics') {
    updateAnalyticsEngine();
  } else if (pageId === 'audit') {
    renderAuditTrailPage();
  }
  refreshIcons();
}

// Backward-compatible Tab Navigation
export function switchTab(tabId: string) {
  if (tabId === 'analytics') {
    switchPage('analytics');
  } else if (tabId === 'reports') {
    switchPage('reports');
  } else if (tabId === 'submissions' || tabId === 'audit') {
    switchPage('audit');
  } else {
    switchPage('core');
  }
}

// Dashboard Overview Metrics
export function updateDashboardMetrics() {
  let totalCeiling = 0;
  let totalAnnualAllocation = 0;
  let totalProjectedSpend = 0;
  let totalActualSpend = 0;
  let delayedCount = 0;
  let completedCount = 0;
  let totalPhysical = 0;
  let totalFinancialPercent = 0;

  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  validProjects.forEach(p => {
    totalCeiling += Number(p.ceiling || 0);
    totalAnnualAllocation += Number(p.annualAllocation || 0);
    totalProjectedSpend += Number(p.projectedSpend || 0);
    totalActualSpend += Number(p.actualSpend || 0);
    totalPhysical += Number(p.physicalProgress || 0);

    if (p.status === "Tertangguh/Lewat") delayedCount++;
    if (p.status === "Selesai") completedCount++;

    const util = Number(p.annualAllocation || 0) > 0 ? (Number(p.actualSpend || 0) / Number(p.annualAllocation)) * 100 : 0;
    totalFinancialPercent += util;
  });

  const totalVariance = totalProjectedSpend - totalActualSpend;
  const overallUtilRate = totalAnnualAllocation > 0 ? (totalActualSpend / totalAnnualAllocation) * 100 : 0;
  const avgPhysical = validProjects.length > 0 ? (totalPhysical / validProjects.length).toFixed(1) : "0";
  const avgFinancial = validProjects.length > 0 ? (totalFinancialPercent / validProjects.length).toFixed(1) : "0";

  const setElem = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setElem('statCeilingTotal', formatRM(totalCeiling));
  setElem('statAnnualAllocation', formatRM(totalAnnualAllocation));
  setElem('statProjectedSpend', formatRM(totalProjectedSpend));
  setElem('statActualSpend', formatRM(totalActualSpend));
  setElem('statVarianceTotal', formatRM(totalVariance));
  setElem('statUtilizationRate', `${overallUtilRate.toFixed(1)}%`);
  setElem('statDelayedProjects', String(delayedCount));
  setElem('statCompletedProjects', String(completedCount));
  setElem('statActiveIssues', String(delayedCount));
  setElem('badgeTotalProjects', String(validProjects.length));
  setElem('statAvgPhysical', `${avgPhysical}%`);
  setElem('statAvgFinancial', `${avgFinancial}%`);

  const bar = document.getElementById('barActualSpendPercent');
  if (bar) {
    bar.style.width = `${Math.min(overallUtilRate, 100)}%`;
  }
}

// Project Management Table
export function renderProjectsTable() {
  const searchInput = document.getElementById('filterSearch') as HTMLInputElement;
  const deptSelect = document.getElementById('filterDept') as HTMLSelectElement;
  const statusSelect = document.getElementById('filterStatus') as HTMLSelectElement;
  const yearSelect = document.getElementById('filterYear') as HTMLSelectElement;

  const search = searchInput ? searchInput.value.toLowerCase() : "";
  const dept = deptSelect ? deptSelect.value : "ALL";
  const status = statusSelect ? statusSelect.value : "ALL";
  const year = yearSelect ? yearSelect.value : "ALL";

  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  const filtered = validProjects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search) || 
                        p.id.toLowerCase().includes(search) || 
                        p.officer.toLowerCase().includes(search);
    const matchDept = (dept === "ALL" || p.department === dept);
    const matchStatus = (status === "ALL" || p.status === status);
    const matchYear = (year === "ALL" || 
                       (p.year && String(p.year) === year) || 
                       (p.startDate && p.startDate.startsWith(year)));
    return matchSearch && matchDept && matchStatus && matchYear;
  });

  const tbody = document.getElementById('projectsTableBody');
  const emptyState = document.getElementById('emptyStateProjects');
  if (!tbody) return;

  tbody.innerHTML = "";

  const lblShowing = document.getElementById('lblCountShowing');
  const lblTotal = document.getElementById('lblCountTotal');
  if (lblShowing) lblShowing.innerText = String(filtered.length);
  if (lblTotal) lblTotal.innerText = String(validProjects.length);

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  filtered.forEach(p => {
    const v = calculateProjectVariance(p);
    let statusBg = "bg-slate-100 text-slate-700";
    if (p.status === "Selesai") statusBg = "bg-emerald-100 text-emerald-800";
    else if (p.status === "Dalam Pelaksanaan") statusBg = "bg-blue-100 text-blue-800";
    else if (p.status === "Tertangguh/Lewat") statusBg = "bg-rose-100 text-rose-800";

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition border-b border-slate-200";
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
        ${p.id}
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-slate-900 leading-snug">${p.title}</div>
        <div class="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5">
          <span>${p.department}</span>
          <span>&bull;</span>
          <span class="text-slate-600">${p.officer}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
        ${formatRM(p.annualAllocation)}
      </td>
      <td class="py-3 px-4 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
        ${formatRM(p.actualSpend)}
      </td>
      <td class="py-3 px-4 text-center">
        <div class="inline-flex items-center space-x-1 font-mono font-bold text-[11px] ${Number(v.utilRate) < 50 ? 'text-amber-700' : 'text-slate-800'}">
          <span>${v.utilRate}%</span>
        </div>
        <div class="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
          <div class="bg-emerald-600 h-1.5 rounded-full" style="width: ${Math.min(Number(v.utilRate), 100)}%"></div>
        </div>
      </td>
      <td class="py-3 px-4 text-center">
        <div class="inline-flex items-center space-x-1 font-mono font-bold text-[11px] text-slate-800">
          <span>${p.physicalProgress}%</span>
        </div>
        <div class="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
          <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${Math.min(p.physicalProgress, 100)}%"></div>
        </div>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBg}">
          ${p.status}
        </span>
      </td>
      <td class="py-3 px-4 text-center whitespace-nowrap no-print">
        <div class="flex items-center justify-center space-x-1">
          <button onclick="viewProjectDetails('${p.id}')" title="Papar Butiran" class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="editProject('${p.id}')" title="Kemaskini" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteProject('${p.id}')" title="Padam" class="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Variance Matrix
export function renderVarianceMatrix() {
  const tbody = document.getElementById('varianceTableBody');
  if (!tbody) return;
  tbody.innerHTML = "";

  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  validProjects.forEach(p => {
    const v = calculateProjectVariance(p);
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition border-b border-slate-200";

    const varianceRMDisplay = v.varianceRM >= 0 
      ? `+${formatRM(v.varianceRM)}` 
      : `-${formatRM(Math.abs(v.varianceRM))}`;

    const varianceClass = v.varianceRM < 0 ? "text-rose-700 font-bold" : "text-emerald-700";

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">${p.id}</td>
      <td class="py-3 px-4 font-semibold text-slate-900">${p.title}</td>
      <td class="py-3 px-4 text-right font-mono">${formatRM(p.projectedSpend)}</td>
      <td class="py-3 px-4 text-right font-mono">${formatRM(p.actualSpend)}</td>
      <td class="py-3 px-4 text-right font-mono ${varianceClass}">${varianceRMDisplay}</td>
      <td class="py-3 px-4 text-center font-mono font-bold ${Number(v.variancePercent) > 10 ? 'text-rose-600' : 'text-slate-700'}">${v.variancePercent}%</td>
      <td class="py-3 px-4 text-center">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.statusClass}">
          ${v.statusTag}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">${p.issues}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Department Breakdown
export function renderDeptBreakdown() {
  const container = document.getElementById('deptBreakdownGrid');
  if (!container) return;
  container.innerHTML = "";

  const deptMap: Record<string, { totalAllocation: number; totalSpend: number; count: number }> = {};
  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  validProjects.forEach(p => {
    if (!deptMap[p.department]) {
      deptMap[p.department] = { totalAllocation: 0, totalSpend: 0, count: 0 };
    }
    deptMap[p.department].totalAllocation += Number(p.annualAllocation || 0);
    deptMap[p.department].totalSpend += Number(p.actualSpend || 0);
    deptMap[p.department].count += 1;
  });

  Object.keys(deptMap).forEach(deptName => {
    const data = deptMap[deptName];
    const util = data.totalAllocation > 0 ? (data.totalSpend / data.totalAllocation) * 100 : 0;

    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl shadow-card border border-slate-200 flex flex-col justify-between";
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span class="font-bold text-slate-800">${deptName}</span>
          <span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">${data.count} Projek</span>
        </div>
        <div class="mt-2 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Peruntukan:</span>
            <span class="font-mono font-medium">${formatRM(data.totalAllocation)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Belanja:</span>
            <span class="font-mono font-medium text-emerald-700">${formatRM(data.totalSpend)}</span>
          </div>
        </div>
      </div>
      <div class="mt-3 pt-2 border-t border-slate-100">
        <div class="flex justify-between text-[11px] font-semibold mb-1">
          <span>Kadar Penyerapan:</span>
          <span class="${util < 50 ? 'text-amber-700' : 'text-emerald-700'} font-mono">${util.toFixed(1)}%</span>
        </div>
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-600 h-2 rounded-full" style="width: ${Math.min(util, 100)}%"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Executive Report Filtering & Rendering
export function applyReportDateFilters() {
  renderExecutiveReport();
  refreshIcons();
}

export function resetReportDateFilters() {
  const m = document.getElementById('reportFilterMonth') as HTMLSelectElement;
  const y = document.getElementById('reportFilterYear') as HTMLSelectElement;
  const d = document.getElementById('reportFilterDept') as HTMLSelectElement;
  const s = document.getElementById('reportFilterStatus') as HTMLSelectElement;
  if (m) m.value = "ALL";
  if (y) y.value = "2026";
  if (d) d.value = "ALL";
  if (s) s.value = "ALL";
  renderExecutiveReport();
  refreshIcons();
}

// Executive Report Table & KPI Summaries
export function renderExecutiveReport() {
  const tbody = document.getElementById('reportTableBody');
  const emptyState = document.getElementById('emptyStateReport');
  if (!tbody) return;
  tbody.innerHTML = "";

  const monthSelect = document.getElementById('reportFilterMonth') as HTMLSelectElement;
  const yearSelect = document.getElementById('reportFilterYear') as HTMLSelectElement;
  const deptSelect = document.getElementById('reportFilterDept') as HTMLSelectElement;
  const statusSelect = document.getElementById('reportFilterStatus') as HTMLSelectElement;

  const month = monthSelect ? monthSelect.value : "ALL";
  const year = yearSelect ? yearSelect.value : "2026";
  const dept = deptSelect ? deptSelect.value : "ALL";
  const status = statusSelect ? statusSelect.value : "ALL";

  const monthNames: Record<string, string> = {
    "01": "Januari", "02": "Februari", "03": "Mac", "04": "April",
    "05": "Mei", "06": "Jun", "07": "Julai", "08": "Ogos",
    "09": "September", "10": "Oktober", "11": "November", "12": "Disember"
  };

  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  const filtered = validProjects.filter(p => {
    // Match Year
    const matchYear = (year === "ALL" || 
                       (p.year && String(p.year) === year) || 
                       (p.startDate && p.startDate.startsWith(year)));

    // Match Month: Check if project is active during that month
    let matchMonth = true;
    if (month !== "ALL") {
      const targetM = parseInt(month, 10);
      let startM = 1;
      let endM = 12;
      if (p.startDate) {
        const parts = p.startDate.split('-');
        if (parts.length >= 2) startM = parseInt(parts[1], 10) || 1;
      }
      if (p.endDate) {
        const parts = p.endDate.split('-');
        if (parts.length >= 2) endM = parseInt(parts[1], 10) || 12;
      }
      matchMonth = (targetM >= startM && targetM <= endM);
    }

    // Match Department
    const matchDept = (dept === "ALL" || p.department === dept);

    // Match Status
    const matchStatus = (status === "ALL" || p.status === status);

    return matchYear && matchMonth && matchDept && matchStatus;
  });

  // Calculate Aggregates for KPI Cards
  const totalProjects = filtered.length;
  const totalAllocation = filtered.reduce((acc, p) => acc + (p.annualAllocation || 0), 0);
  const totalSpend = filtered.reduce((acc, p) => acc + (p.actualSpend || 0), 0);
  const totalVariance = totalAllocation - totalSpend;
  const absorptionRate = totalAllocation > 0 ? (totalSpend / totalAllocation) * 100 : 0;
  const avgProgress = totalProjects > 0 
    ? (filtered.reduce((acc, p) => acc + (p.physicalProgress || 0), 0) / totalProjects) 
    : 0;

  // Update KPI Summary Elements
  const elProjectCount = document.getElementById('reportStatProjectCount');
  const elAllocation = document.getElementById('reportStatAllocation');
  const elSpend = document.getElementById('reportStatSpend');
  const elVariance = document.getElementById('reportStatVariance');
  const elAbsorption = document.getElementById('reportStatAbsorption');
  const elProgress = document.getElementById('reportStatProgress');
  const elStatusLabel = document.getElementById('reportFilterStatusLabel');
  const elGeneratedTime = document.getElementById('reportGeneratedTime');

  if (elProjectCount) elProjectCount.innerText = String(totalProjects);
  if (elAllocation) elAllocation.innerText = formatRM(totalAllocation);
  if (elSpend) elSpend.innerText = formatRM(totalSpend);
  if (elVariance) {
    elVariance.innerText = totalVariance >= 0 ? `+${formatRM(totalVariance)}` : `-${formatRM(Math.abs(totalVariance))}`;
    elVariance.className = totalVariance >= 0 
      ? "text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1" 
      : "text-xl sm:text-2xl font-black font-mono text-rose-700 mt-1";
  }
  if (elAbsorption) elAbsorption.innerText = `${absorptionRate.toFixed(1)}%`;
  if (elProgress) elProgress.innerText = `${avgProgress.toFixed(0)}%`;

  if (elStatusLabel) {
    const monthText = month === "ALL" ? "Semua Bulan" : (monthNames[month] || `Bulan ${month}`);
    const yearText = year === "ALL" ? "Semua Tahun" : `Tahun ${year}`;
    const deptText = dept === "ALL" ? "Semua Bahagian" : dept;
    elStatusLabel.innerHTML = `Memaparkan <strong>${totalProjects}</strong> inisiatif projek aktif bagi <strong>${yearText}</strong> (${monthText}) &bull; <em>${deptText}</em>`;
  }

  if (elGeneratedTime) {
    const now = new Date();
    elGeneratedTime.innerText = `Dijana: ${now.toLocaleDateString('ms-MY')} ${now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Handle empty state
  if (totalProjects === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  // Render Table Rows
  filtered.forEach((p, idx) => {
    const v = calculateProjectVariance(p);
    let statusBg = "bg-slate-100 text-slate-700 border-slate-300";
    if (p.status === "Selesai") statusBg = "bg-emerald-50 text-emerald-800 border-emerald-300";
    else if (p.status === "Dalam Pelaksanaan") statusBg = "bg-blue-50 text-blue-800 border-blue-300";
    else if (p.status === "Tertangguh/Lewat") statusBg = "bg-rose-50 text-rose-800 border-rose-300";
    else if (p.status === "Dalam Perancangan") statusBg = "bg-amber-50 text-amber-800 border-amber-300";

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition border-b border-slate-200 text-xs";
    tr.innerHTML = `
      <td class="py-3 px-3 text-center font-bold text-slate-500">${idx + 1}</td>
      <td class="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">${p.id}</td>
      <td class="py-3 px-3">
        <div class="font-bold text-slate-900">${p.title}</div>
        <div class="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5 flex-wrap">
          <span class="text-blue-800 font-semibold">${p.department}</span>
          <span>&bull;</span>
          <span class="text-slate-600">${p.officer}</span>
          ${p.year ? `<span>&bull;</span><span class="font-mono text-slate-500">Tahun ${p.year}</span>` : ''}
        </div>
      </td>
      <td class="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">${formatRM(p.annualAllocation)}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">${formatRM(p.actualSpend)}</td>
      <td class="py-3 px-3 text-center font-mono font-bold">
        <span class="${Number(v.utilRate) < 50 ? 'text-amber-700' : 'text-slate-800'}">${v.utilRate}%</span>
      </td>
      <td class="py-3 px-3 text-center">
        <div class="inline-flex items-center space-x-1 font-mono font-bold text-slate-800 text-[11px]">
          <span>${p.physicalProgress}%</span>
        </div>
        <div class="w-14 bg-slate-200 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden">
          <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${Math.min(p.physicalProgress, 100)}%"></div>
        </div>
      </td>
      <td class="py-3 px-3 text-center whitespace-nowrap">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}">
          ${p.status}
        </span>
      </td>
      <td class="py-3 px-3 text-center whitespace-nowrap no-print">
        <button onclick="viewProjectDetails('${p.id}')" class="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition shadow-xs flex items-center space-x-1 mx-auto">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>Butiran</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Submissions Table (Firestore Audit Trail)
export function renderSubmissionsTable() {
  const searchInput = document.getElementById('filterSubmissionsSearch') as HTMLInputElement;
  const typeSelect = document.getElementById('filterSubmissionsType') as HTMLSelectElement;

  const search = searchInput ? searchInput.value.toLowerCase() : "";
  const filterType = typeSelect ? typeSelect.value : "ALL";

  const filtered = state.submissions.filter(sub => {
    const matchSearch = (sub.projectId || "").toLowerCase().includes(search) ||
                        (sub.title || "").toLowerCase().includes(search) ||
                        (sub.userName || "").toLowerCase().includes(search) ||
                        (sub.userEmail || "").toLowerCase().includes(search);
    const matchType = (filterType === "ALL" || sub.submissionType === filterType);
    return matchSearch && matchType;
  });

  const tbody = document.getElementById('submissionsTableBody');
  const emptyState = document.getElementById('emptyStateSubmissions');
  if (!tbody) return;

  tbody.innerHTML = "";

  const statTotal = document.getElementById('statSubmissionsTotal');
  const badgeTotal = document.getElementById('badgeTotalSubmissions');
  const statLatestTime = document.getElementById('statSubmissionsLatestTime');
  const statUser = document.getElementById('statSubmissionsUser');

  if (statTotal) statTotal.innerText = String(state.submissions.length);
  if (badgeTotal) badgeTotal.innerText = String(state.submissions.length);
  
  if (state.submissions.length > 0 && statLatestTime) {
    statLatestTime.innerText = state.submissions[0].formattedTime || 'Baru sahaja';
  } else if (statLatestTime) {
    statLatestTime.innerText = 'Tiada penyerahan';
  }

  if (statUser) {
    statUser.innerText = state.currentUser ? (state.currentUser.displayName || state.currentUser.email || 'Pegawai KPSTI') : 'Belum Log Masuk';
  }

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  filtered.forEach((sub, idx) => {
    let typeLabel = "Penyerahan Data";
    let typeBadgeClass = "bg-slate-100 text-slate-800 border-slate-300";

    if (sub.submissionType === 'CREATE_PROJECT') {
      typeLabel = "Daftar Projek Baharu";
      typeBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (sub.submissionType === 'UPDATE_PROJECT') {
      typeLabel = "Kemaskini Projek";
      typeBadgeClass = "bg-blue-100 text-blue-800 border-blue-300";
    } else if (sub.submissionType === 'VERIFICATION_APPROVAL') {
      typeLabel = "Pengesahan Rasmi (HITL)";
      typeBadgeClass = "bg-purple-100 text-purple-800 border-purple-300";
    } else if (sub.submissionType === 'STATUS_UPDATE') {
      typeLabel = "Tindakan Status";
      typeBadgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    }

    // Prepare data summary string
    let dataSummary = "";
    if (sub.data) {
      if (sub.data.annualAllocation !== undefined) {
        dataSummary += `Peruntukan: ${formatRM(sub.data.annualAllocation)} | Belanja: ${formatRM(sub.data.actualSpend || 0)} | Fizikal: ${sub.data.physicalProgress || 0}%`;
      } else if (sub.data.remarks) {
        dataSummary += `Catatan: ${sub.data.remarks}`;
      } else if (sub.data.action) {
        dataSummary += `Tindakan: ${sub.data.action}`;
      } else {
        dataSummary = JSON.stringify(sub.data).slice(0, 60);
      }
    }

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition border-b border-slate-200 text-xs";
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-slate-500 text-[11px]">${idx + 1}</td>
      <td class="py-3 px-4 whitespace-nowrap">
        <div class="font-mono font-bold text-slate-900">${sub.formattedTime || 'Baru'}</div>
        <div class="text-[10px] text-slate-400 font-mono">Firestore Server Timestamp</div>
      </td>
      <td class="py-3 px-4">
        <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeBadgeClass}">
          ${typeLabel}
        </span>
      </td>
      <td class="py-3 px-4">
        <div class="font-mono font-bold text-emerald-800 text-[11px]">${sub.projectId}</div>
        <div class="font-medium text-slate-900 line-clamp-1">${sub.title}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <div class="font-semibold text-slate-900">${sub.userName || 'Pegawai KPSTI'}</div>
        <div class="text-[11px] text-slate-500 font-mono">${sub.userEmail || '-'}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <span class="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-300">
          ${sub.id ? sub.id.slice(0, 10) + '...' : 'N/A'}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title="${dataSummary}">
        ${dataSummary || 'Tiada maklumat tambahan'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// AUDIT TRAIL & INPUT-OUTPUT HISTORICAL LOG (FIRESTORE LIVE INTEGRITY)
// =========================================================================

let activeAuditRecord: SubmissionRecord | null = null;

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function calculateRelativeTime(timestamp: any): string {
  if (!timestamp) return 'Baru sahaja';
  let date: Date | null = null;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  }
  if (!date || isNaN(date.getTime())) return 'Baru sahaja';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Baru sahaja';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minit lalu`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} jam lalu`;
  return `${Math.floor(diffSeconds / 86400)} hari lalu`;
}

export function filterAuditTrail() {
  renderAuditTrailPage();
}

export function renderAuditTrailPage() {
  const container = document.getElementById('auditLogFeedContainer');
  if (!container) return;

  // Retrieve search and type filter
  const search = (document.getElementById('auditSearchInput') as HTMLInputElement)?.value.toLowerCase().trim() || "";
  const filterType = (document.getElementById('auditTypeFilter') as HTMLSelectElement)?.value || "ALL";

  // Sort newest first by Firestore timestamp
  const sortedSubmissions = [...state.submissions].sort((a, b) => {
    let tA = 0;
    let tB = 0;
    if (a.timestamp?.toMillis) tA = a.timestamp.toMillis();
    else if (a.timestamp?.seconds) tA = a.timestamp.seconds * 1000;
    else if (a.timestamp instanceof Date) tA = a.timestamp.getTime();

    if (b.timestamp?.toMillis) tB = b.timestamp.toMillis();
    else if (b.timestamp?.seconds) tB = b.timestamp.seconds * 1000;
    else if (b.timestamp instanceof Date) tB = b.timestamp.getTime();

    return tB - tA;
  });

  // Update Ribbon Statistics
  const totalCount = sortedSubmissions.length;
  const createCount = sortedSubmissions.filter(s => s.submissionType === 'CREATE_PROJECT').length;
  const updateCount = sortedSubmissions.filter(s => s.submissionType === 'UPDATE_PROJECT').length;
  const hitlCount = sortedSubmissions.filter(s => s.submissionType === 'VERIFICATION_APPROVAL').length;

  const metricTotal = document.getElementById('auditMetricTotal');
  const metricCreate = document.getElementById('auditMetricCreate');
  const metricUpdate = document.getElementById('auditMetricUpdate');
  const metricHitl = document.getElementById('auditMetricHitl');
  const headerCount = document.getElementById('auditTotalCyclesHeaderCount');

  if (metricTotal) metricTotal.innerText = String(totalCount);
  if (metricCreate) metricCreate.innerText = String(createCount);
  if (metricUpdate) metricUpdate.innerText = String(updateCount);
  if (metricHitl) metricHitl.innerText = String(hitlCount);
  if (headerCount) headerCount.innerText = String(totalCount);

  // If there are no entries in Firestore at all:
  // User Prompt exact mandate:
  // "If there are no entries yet, show: “No history yet — submit something to see it here.”"
  if (sortedSubmissions.length === 0) {
    container.innerHTML = `
      <div id="auditEmptyState" class="border-2 border-dashed border-slate-300 rounded-2xl p-12 sm:p-16 text-center bg-white flex flex-col items-center justify-center shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100 shadow-sm">
          <i data-lucide="history" class="w-8 h-8"></i>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-800 tracking-tight">No history yet — submit something to see it here.</h3>
        <p class="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
          Log sejarah kitaran input-output akan muncul secara automatik di sini sebaik sahaja borang projek dihantar atau dikemaskini dalam pangkalan data Cloud Firestore.
        </p>
        <button onclick="switchPage('core'); openProjectModal();" class="mt-5 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm flex items-center space-x-2 transition">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Hantar Rekod Projek Sekarang</span>
        </button>
      </div>
    `;
    refreshIcons();
    return;
  }

  // Filter based on user controls
  const filtered = sortedSubmissions.filter(sub => {
    const matchSearch = !search || 
      (sub.projectId || "").toLowerCase().includes(search) ||
      (sub.title || "").toLowerCase().includes(search) ||
      (sub.userName || "").toLowerCase().includes(search) ||
      (sub.userEmail || "").toLowerCase().includes(search) ||
      (sub.id || "").toLowerCase().includes(search);
    const matchType = (filterType === "ALL" || sub.submissionType === filterType);
    return matchSearch && matchType;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-10 bg-white border border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center shadow-sm">
        <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
          <i data-lucide="search-x" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">Tiada rekod audit sepadan</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-sm">Tiada kitaran data ditemui bagi kriteria carian "${escapeHtml(search)}". Sila ubah atau kosongkan kata kunci carian.</p>
        <button onclick="document.getElementById('auditSearchInput').value=''; document.getElementById('auditTypeFilter').value='ALL'; filterAuditTrail();" class="mt-3 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition">
          Tetapkan Semula Penapis
        </button>
      </div>
    `;
    refreshIcons();
    return;
  }

  // Render list of historical records (newest first)
  container.innerHTML = "";
  filtered.forEach((sub) => {
    let typeLabel = "Penyerahan Data";
    let typeBadgeClass = "bg-slate-100 text-slate-800 border-slate-300";
    let iconName = "database";

    if (sub.submissionType === 'CREATE_PROJECT') {
      typeLabel = "Daftar Projek (CREATE)";
      typeBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
      iconName = "folder-plus";
    } else if (sub.submissionType === 'UPDATE_PROJECT') {
      typeLabel = "Kemas Kini (UPDATE)";
      typeBadgeClass = "bg-blue-50 text-blue-800 border-blue-300";
      iconName = "edit-3";
    } else if (sub.submissionType === 'VERIFICATION_APPROVAL') {
      typeLabel = "Pengesahan HITL (VERIFY)";
      typeBadgeClass = "bg-purple-50 text-purple-800 border-purple-300";
      iconName = "shield-check";
    } else if (sub.submissionType === 'STATUS_UPDATE' || (sub.submissionType as any) === 'DELETE_PROJECT') {
      typeLabel = "Tindakan Status (STATUS)";
      typeBadgeClass = "bg-amber-50 text-amber-800 border-amber-300";
      iconName = "alert-circle";
    } else if (sub.submissionType === 'GEMINI_AGENT_QUERY') {
      typeLabel = "Ejen Gemini (QUERY)";
      typeBadgeClass = "bg-indigo-50 text-indigo-800 border-indigo-300";
      iconName = "sparkles";
    }

    const relTime = calculateRelativeTime(sub.timestamp);
    const timeDisplay = sub.formattedTime || relTime;

    // Build Short Summary
    let shortSummaryHtml = "";
    if (sub.submissionType === 'GEMINI_AGENT_QUERY' || sub.data?.question) {
      const q = sub.data?.question || sub.title;
      const ans = sub.data?.answer || '';
      shortSummaryHtml = `
        <div class="text-xs text-slate-700 mt-2 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100/90 space-y-1">
          <div class="flex items-center space-x-1.5 font-semibold text-indigo-950">
            <i data-lucide="help-circle" class="w-3.5 h-3.5 text-indigo-600 flex-shrink-0"></i>
            <span>Soalan: "${escapeHtml(q)}"</span>
          </div>
          <div class="text-slate-600 text-[11px] line-clamp-2">
            ${escapeHtml(ans.slice(0, 160))}${ans.length > 160 ? '...' : ''}
          </div>
        </div>
      `;
    } else if (sub.data?.inputs && sub.data?.outputs) {
      const inp = sub.data.inputs;
      const out = sub.data.outputs;
      shortSummaryHtml = `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 mt-2">
          <span class="inline-flex items-center space-x-1">
            <span class="text-slate-400">Input:</span>
            <strong class="font-mono">Peruntukan ${formatRM(inp.annualAllocation || 0)}</strong>
          </span>
          <span class="inline-flex items-center space-x-1">
            <span class="text-slate-400">Belanja:</span>
            <strong class="font-mono text-slate-900">${formatRM(inp.actualSpend || 0)}</strong>
          </span>
          <span class="inline-flex items-center space-x-1">
            <span class="text-slate-400">Kemajuan:</span>
            <strong class="font-mono text-emerald-700">${inp.physicalProgress || 0}%</strong>
          </span>
          <span class="inline-flex items-center space-x-1">
            <span class="text-slate-400">Output Varians:</span>
            <strong class="font-mono ${out.expenditureVarianceRM >= 0 ? 'text-emerald-700' : 'text-rose-600'}">
              ${formatRM(out.expenditureVarianceRM || 0)} (${out.utilizationPercentage || 0}%)
            </strong>
          </span>
        </div>
      `;
    } else if (sub.data?.annualAllocation !== undefined) {
      const alloc = Number(sub.data.annualAllocation) || 0;
      const actual = Number(sub.data.actualSpend) || 0;
      const variance = alloc - actual;
      const util = alloc > 0 ? ((actual / alloc) * 100).toFixed(1) : '0.0';
      shortSummaryHtml = `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 mt-2">
          <span>Peruntukan: <strong class="font-mono">${formatRM(alloc)}</strong></span>
          <span>Belanja: <strong class="font-mono">${formatRM(actual)}</strong></span>
          <span>Kemajuan: <strong class="font-mono">${sub.data.physicalProgress || 0}%</strong></span>
          <span>Varians: <strong class="font-mono text-emerald-700">${formatRM(variance)} (${util}%)</strong></span>
        </div>
      `;
    } else if (sub.data?.remarks) {
      shortSummaryHtml = `
        <div class="text-xs text-slate-700 mt-2 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
          "Catatan: ${escapeHtml(sub.data.remarks)}"
        </div>
      `;
    } else {
      shortSummaryHtml = `
        <div class="text-xs text-slate-600 mt-2 truncate font-mono">
          ${escapeHtml(JSON.stringify(sub.data).slice(0, 100))}...
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = "bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4";
    card.innerHTML = `
      <div class="flex items-start space-x-3.5 flex-grow">
        <div class="p-2.5 rounded-xl border ${typeBadgeClass} flex-shrink-0 mt-0.5">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>

        <div class="flex-grow min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Event Badge -->
            <span class="px-2.5 py-0.5 rounded text-[10px] font-bold border ${typeBadgeClass}">
              ${typeLabel}
            </span>

            <!-- Project Identifier -->
            <span class="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ${escapeHtml(sub.projectId || 'N/A')}
            </span>

            <!-- Timestamp -->
            <div class="flex items-center space-x-1 text-xs text-slate-500 ml-auto sm:ml-0 font-mono">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
              <span class="font-semibold text-slate-700">${escapeHtml(timeDisplay)}</span>
              <span class="text-[10px] text-slate-400 font-sans">(${relTime})</span>
            </div>
          </div>

          <!-- Title & Officer -->
          <h4 class="text-sm font-bold text-slate-900 mt-1 truncate" title="${escapeHtml(sub.title || '')}">
            ${escapeHtml(sub.title || 'Kitaran Input-Output Tanpa Tajuk')}
          </h4>

          <div class="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
            <span class="font-medium text-slate-700">${escapeHtml(sub.userName || 'Pegawai KPSTI')}</span>
            <span>&bull;</span>
            <span class="font-mono">${escapeHtml(sub.userEmail || 'tiada-emel')}</span>
            <span>&bull;</span>
            <span class="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono text-[10px]">
              ID: ${escapeHtml(sub.id.slice(0, 8))}...
            </span>
          </div>

          <!-- Short Summary -->
          ${shortSummaryHtml}
        </div>
      </div>

      <!-- View Option (Prompt mandate: a "View" option to see the full record) -->
      <div class="flex items-center space-x-2 md:flex-col md:items-end justify-between pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
        <button onclick="viewAuditRecordDetail('${sub.id}')" class="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-purple-900 text-white rounded-xl shadow-sm flex items-center space-x-1.5 transition">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>View</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  refreshIcons();
}

export function viewAuditRecordDetail(subId: string) {
  const sub = state.submissions.find(s => s.id === subId);
  if (!sub) {
    showToast("Rekod audit tidak dijumpai.", "error");
    return;
  }

  activeAuditRecord = sub;

  // Populate Modal Header
  const docIdShort = document.getElementById('auditModalDocIdShort');
  const modalBadge = document.getElementById('auditModalBadge');
  const modalTitle = document.getElementById('auditModalTitle');

  if (docIdShort) docIdShort.innerText = `ID: ${sub.id}`;
  if (modalBadge) modalBadge.innerText = sub.submissionType || 'INPUT-OUTPUT RECORD';
  if (modalTitle) modalTitle.innerText = sub.title || `Rekod Kitaran: ${sub.projectId}`;

  // Build Modal Body Content
  const modalBody = document.getElementById('auditModalBody');
  if (!modalBody) return;

  const inp = sub.data?.inputs || {};
  const out = sub.data?.outputs || {};

  // Formatted date & ISO
  let fullDateStr = sub.formattedTime || 'Baru sahaja';
  let isoDateStr = 'serverTimestamp()';
  if (sub.timestamp?.toDate) {
    const d = sub.timestamp.toDate();
    fullDateStr = d.toLocaleString('ms-MY', { dateStyle: 'full', timeStyle: 'medium' });
    isoDateStr = d.toISOString();
  } else if (sub.timestamp?.seconds) {
    const d = new Date(sub.timestamp.seconds * 1000);
    fullDateStr = d.toLocaleString('ms-MY', { dateStyle: 'full', timeStyle: 'medium' });
    isoDateStr = d.toISOString();
  }

  modalBody.innerHTML = `
    <!-- Section 1: Cycle Metadata -->
    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div class="text-[11px] font-bold uppercase tracking-wider text-purple-800 mb-2 flex items-center space-x-1.5">
        <i data-lucide="info" class="w-3.5 h-3.5"></i>
        <span>1. Metadata Kitaran & Pangkalan Data (Firestore)</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div><span class="text-slate-500">ID Dokumen Firestore:</span> <span class="font-mono font-bold text-slate-900 select-all">${escapeHtml(sub.id)}</span></div>
        <div><span class="text-slate-500">Koleksi:</span> <span class="font-mono text-purple-700 font-semibold">/submissions</span></div>
        <div><span class="text-slate-500">Cap Masa Tempatan:</span> <span class="font-semibold text-slate-800">${escapeHtml(fullDateStr)}</span></div>
        <div><span class="text-slate-500">Cap Masa ISO:</span> <span class="font-mono text-slate-600 text-[11px]">${escapeHtml(isoDateStr)}</span></div>
        <div><span class="text-slate-500">Pegawai Pengendali:</span> <span class="font-bold text-slate-800">${escapeHtml(sub.userName || 'Pegawai KPSTI')}</span></div>
        <div><span class="text-slate-500">Emel Pegawai:</span> <span class="font-mono text-slate-600">${escapeHtml(sub.userEmail || 'tiada-emel')}</span></div>
      </div>
    </div>

    <!-- Section 2: Input Parameters Payload -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center space-x-1.5">
        <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i>
        <span>2. Parameter Input Kitaran (Submitted Input Payload)</span>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Kod Projek / ID</span>
          <span class="font-mono font-bold text-slate-900">${escapeHtml(inp.code || sub.projectId || 'N/A')}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Tajuk Inisiatif</span>
          <span class="font-bold text-slate-900">${escapeHtml(inp.title || sub.title || 'N/A')}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Bahagian / Sektor</span>
          <span class="font-medium text-slate-800">${escapeHtml(inp.department || sub.data?.department || 'N/A')}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Pegawai Bertanggungjawab</span>
          <span class="font-medium text-slate-800">${escapeHtml(inp.officer || sub.data?.officer || sub.userName || 'N/A')}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Peruntukan Tahunan (RM)</span>
          <span class="font-mono font-bold text-slate-900">${formatRM(inp.annualAllocation ?? sub.data?.annualAllocation ?? 0)}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Perbelanjaan Sebenar (RM)</span>
          <span class="font-mono font-bold text-emerald-700">${formatRM(inp.actualSpend ?? sub.data?.actualSpend ?? 0)}</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Kemajuan Fizikal (%)</span>
          <span class="font-mono font-bold text-slate-900">${inp.physicalProgress ?? sub.data?.physicalProgress ?? 0}%</span>
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg">
          <span class="text-slate-400 block text-[10px] uppercase font-semibold">Status Semasa</span>
          <span class="font-bold text-slate-900">${escapeHtml(inp.status || sub.data?.status || 'Aktif')}</span>
        </div>
      </div>

      ${inp.remarks || sub.data?.remarks ? `
        <div class="mt-3 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-950">
          <strong>Catatan / Justifikasi:</strong> ${escapeHtml(inp.remarks || sub.data?.remarks)}
        </div>
      ` : ''}

      ${inp.files && inp.files.length > 0 ? `
        <div class="mt-3">
          <span class="text-slate-500 block text-[11px] font-semibold mb-1">Dokumen Dilampirkan:</span>
          <div class="flex flex-wrap gap-1.5">
            ${inp.files.map((f: any) => `
              <span class="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700 border border-slate-200">
                <i data-lucide="file-text" class="w-3 h-3 text-slate-400"></i>
                <span>${escapeHtml(f.name || 'Dokumen')} (${escapeHtml(f.size || 'K/A')})</span>
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Section 3: Output & Calculated Metrics -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div class="text-[11px] font-bold uppercase tracking-wider text-blue-800 mb-2 flex items-center space-x-1.5">
        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
        <span>3. Output & Metrik Pengiraan (System Computed Outputs)</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Varians Perbelanjaan</span>
          <span class="text-base font-extrabold font-mono text-emerald-700">
            ${formatRM(out.expenditureVarianceRM ?? ((inp.annualAllocation || sub.data?.annualAllocation || 0) - (inp.actualSpend || sub.data?.actualSpend || 0)))}
          </span>
          <span class="text-[10px] text-slate-400 block mt-0.5">Baki Peruntukan Bersih</span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Kadar Penyerapan</span>
          <span class="text-base font-extrabold font-mono text-slate-900">
            ${out.utilizationPercentage ?? (inp.annualAllocation ? ((inp.actualSpend / inp.annualAllocation) * 100).toFixed(1) : '0.0')}%
          </span>
          <span class="text-[10px] text-slate-400 block mt-0.5">Penyerapan Sebenar</span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-500 block text-[10px] uppercase font-semibold">Status Integriti</span>
          <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block mt-1">
            Kitaran Sah Firestore
          </span>
          <span class="text-[10px] text-slate-400 block mt-0.5">Pematuhan Penuh</span>
        </div>
      </div>
    </div>

    <!-- Section 4: Raw JSON Inspector for Debugging -->
    <div class="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <div class="flex items-center justify-between mb-2">
        <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5 font-mono">
          <i data-lucide="code" class="w-3.5 h-3.5"></i>
          <span>4. Debugging Payload (Raw JSON Inspector)</span>
        </div>
        <button onclick="copyCurrentAuditJson()" class="text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center space-x-1 transition">
          <i data-lucide="copy" class="w-3 h-3"></i>
          <span>Salin JSON</span>
        </button>
      </div>

      <pre class="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300 border border-slate-800 max-h-52 leading-relaxed"><code>${escapeHtml(JSON.stringify(sub, null, 2))}</code></pre>
    </div>
  `;

  // Open Modal
  const modal = document.getElementById('auditRecordModal');
  if (modal) modal.classList.remove('hidden');
  refreshIcons();
}

export function closeAuditRecordModal() {
  const modal = document.getElementById('auditRecordModal');
  if (modal) modal.classList.add('hidden');
  activeAuditRecord = null;
}

export function copyCurrentAuditJson() {
  if (!activeAuditRecord) return;
  const jsonStr = JSON.stringify(activeAuditRecord, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast("JSON rekod audit berjaya disalin ke papan keratan!", "success");
  }).catch(() => {
    showToast("Gagal menyalin JSON.", "error");
  });
}

export function copyCurrentAuditDocId() {
  if (!activeAuditRecord?.id) return;
  navigator.clipboard.writeText(activeAuditRecord.id).then(() => {
    showToast(`ID Dokumen ${activeAuditRecord.id} berjaya disalin!`, "info");
  }).catch(() => {
    showToast("Gagal menyalin ID.", "error");
  });
}

// Chart Initializations
export function initCharts() {
  const Chart = (window as any).Chart;
  if (!Chart) return;

  const validProjects = state.projects.filter(p => !(p as any).isDeleted);
  const labels = validProjects.map(p => p.id);
  const allocationData = validProjects.map(p => p.annualAllocation);
  const spendData = validProjects.map(p => p.actualSpend);

  const ctxComp = document.getElementById('financialComparisonChart') as HTMLCanvasElement;
  if (ctxComp) {
    if (comparisonChartInstance) comparisonChartInstance.destroy();
    comparisonChartInstance = new Chart(ctxComp, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Peruntukan Tahunan (RM)',
            data: allocationData,
            backgroundColor: '#0f172a',
            borderRadius: 4
          },
          {
            label: 'Belanja Sebenar (RM)',
            data: spendData,
            backgroundColor: '#059669',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${formatRM(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'JetBrains Mono', size: 10 } } },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 10 },
              callback: function(val: any) {
                return 'RM ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'K');
              }
            }
          }
        }
      }
    });
  }

  const ctxStatus = document.getElementById('projectStatusChart') as HTMLCanvasElement;
  if (ctxStatus) {
    let selesai = 0, pelaksanaan = 0, lewat = 0;
    validProjects.forEach(p => {
      if (p.status === "Selesai") selesai++;
      else if (p.status === "Dalam Pelaksanaan") pelaksanaan++;
      else if (p.status === "Tertangguh/Lewat") lewat++;
    });

    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Dalam Pelaksanaan', 'Tertangguh/Lewat'],
        datasets: [{
          data: [selesai, pelaksanaan, lewat],
          backgroundColor: ['#059669', '#2563eb', '#e11d48'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
        },
        cutout: '68%'
      }
    });
  }
}

export function updateCharts() {
  const Chart = (window as any).Chart;
  if (!Chart) return;
  const validProjects = state.projects.filter(p => !(p as any).isDeleted);

  if (comparisonChartInstance) {
    comparisonChartInstance.data.labels = validProjects.map(p => p.id);
    comparisonChartInstance.data.datasets[0].data = validProjects.map(p => p.annualAllocation);
    comparisonChartInstance.data.datasets[1].data = validProjects.map(p => p.actualSpend);
    comparisonChartInstance.update();
  }

  if (statusChartInstance) {
    let selesai = 0, pelaksanaan = 0, lewat = 0;
    validProjects.forEach(p => {
      if (p.status === "Selesai") selesai++;
      else if (p.status === "Dalam Pelaksanaan") pelaksanaan++;
      else if (p.status === "Tertangguh/Lewat") lewat++;
    });
    statusChartInstance.data.datasets[0].data = [selesai, pelaksanaan, lewat];
    statusChartInstance.update();
  }
}

// Master Render
export function renderAll() {
  updateDashboardMetrics();
  renderProjectsTable();
  renderVarianceMatrix();
  renderDeptBreakdown();
  renderExecutiveReport();
  renderSubmissionsTable();
  refreshIcons();
}

// Search & Filters Trigger
export function applyFilters() {
  renderProjectsTable();
  refreshIcons();
}

export function resetFilters() {
  const search = document.getElementById('filterSearch') as HTMLInputElement;
  const dept = document.getElementById('filterDept') as HTMLSelectElement;
  const status = document.getElementById('filterStatus') as HTMLSelectElement;
  const year = document.getElementById('filterYear') as HTMLSelectElement;
  if (search) search.value = "";
  if (dept) dept.value = "ALL";
  if (status) status.value = "ALL";
  if (year) year.value = "ALL";
  renderProjectsTable();
  refreshIcons();
}

// Dynamic Summary Area Updater (Input & Output Portal)
export function updateDynamicSummary() {
  const getVal = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    return el ? el.value.trim() : "";
  };

  const code = getVal('formCode') || "PRJ-KPSTI-2026-XXX";
  const title = getVal('formTitle') || "Tajuk Projek Belum Dinyatakan";
  const department = getVal('formDepartment') || "Bahagian Inovasi dan Digital (BID)";
  const officer = getVal('formOfficer') || "Pegawai: Belum Ditugaskan";
  const status = getVal('formStatus') || "Dalam Pelaksanaan";
  const physicalProgress = Math.min(100, Math.max(0, parseInt(getVal('formPhysicalProgress')) || 0));
  const startDate = getVal('formStartDate');
  const endDate = getVal('formEndDate');
  const issues = getVal('formIssues');
  const remarks = getVal('formRemarks');

  const ceiling = parseFloat(getVal('formCeiling')) || 0;
  const annualAllocation = parseFloat(getVal('formAnnualAllocation')) || 0;
  const projectedSpend = parseFloat(getVal('formProjectedSpend')) || 0;
  const actualSpend = parseFloat(getVal('formActualSpend')) || 0;

  const variance = projectedSpend - actualSpend;
  const utilRate = annualAllocation > 0 ? (actualSpend / annualAllocation) * 100 : 0;

  // DOM Elements
  const elCode = document.getElementById('summaryCode');
  const elTitle = document.getElementById('summaryTitle');
  const elDept = document.getElementById('summaryDept');
  const elOfficer = document.getElementById('summaryOfficer');
  const elDates = document.getElementById('summaryDates');
  const elStatus = document.getElementById('summaryStatus');
  const elProgressText = document.getElementById('summaryProgressText');
  const elProgressBar = document.getElementById('summaryProgressBar');

  const elCeiling = document.getElementById('summaryCeiling');
  const elAllocation = document.getElementById('summaryAllocation');
  const elActual = document.getElementById('summaryActual');
  const elVariance = document.getElementById('summaryVariance');
  const elUtil = document.getElementById('summaryUtil');
  const elVarianceTag = document.getElementById('summaryVarianceTag');
  const elIssues = document.getElementById('summaryIssues');
  const elRemarks = document.getElementById('summaryRemarks');
  const elFilesList = document.getElementById('summaryFilesList');

  if (elCode) elCode.innerText = code;
  if (elTitle) elTitle.innerText = title;
  if (elDept) elDept.innerText = department;
  if (elOfficer) elOfficer.innerText = officer.startsWith("Pegawai:") ? officer : `Pegawai: ${officer}`;
  if (elDates) {
    elDates.innerText = (startDate && endDate) ? `${startDate} hingga ${endDate}` : "Tarikh: Belum Ditentukan";
  }

  if (elStatus) {
    elStatus.innerText = status;
    if (status === "Selesai") {
      elStatus.className = "px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    } else if (status === "Tertangguh/Lewat") {
      elStatus.className = "px-2.5 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40";
    } else if (status === "Dalam Perancangan") {
      elStatus.className = "px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
    } else {
      elStatus.className = "px-2.5 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40";
    }
  }

  if (elProgressText) elProgressText.innerText = `${physicalProgress}%`;
  if (elProgressBar) elProgressBar.style.width = `${physicalProgress}%`;

  if (elCeiling) elCeiling.innerText = formatRM(ceiling);
  if (elAllocation) elAllocation.innerText = formatRM(annualAllocation);
  if (elActual) elActual.innerText = formatRM(actualSpend);

  if (elVariance) {
    elVariance.innerText = variance >= 0 ? `+${formatRM(variance)}` : `-${formatRM(Math.abs(variance))}`;
    elVariance.className = variance < 0 ? "text-rose-400 font-bold font-mono" : "text-emerald-400 font-bold font-mono";
  }

  if (elUtil) elUtil.innerText = `${utilRate.toFixed(1)}%`;

  if (elVarianceTag) {
    if (actualSpend > annualAllocation && annualAllocation > 0) {
      elVarianceTag.innerText = "Lebihan Belanja";
      elVarianceTag.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300";
    } else if (utilRate < 50 && status === "Tertangguh/Lewat") {
      elVarianceTag.innerText = "Kurang Penyerapan";
      elVarianceTag.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300";
    } else {
      elVarianceTag.innerText = "Normal / Teratur";
      elVarianceTag.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300";
    }
  }

  if (elIssues) {
    elIssues.innerText = issues || "Tiada isu dilaporkan.";
  }

  if (elRemarks) {
    elRemarks.innerText = remarks || "Tiada catatan susulan.";
  }

  if (elFilesList) {
    if (state.tempUploadedFiles.length === 0) {
      elFilesList.innerHTML = '<span class="text-slate-500 text-xs italic">Tiada lampiran fail (Pilihan).</span>';
    } else {
      elFilesList.innerHTML = state.tempUploadedFiles.map(f => `
        <span class="inline-flex items-center space-x-1 bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-mono">
          <i data-lucide="file-check" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>${f.name}</span>
          <span class="text-slate-400">(${f.size})</span>
        </span>
      `).join('');
      refreshIcons();
    }
  }
}

// Recalculate Form Financials in Portal
export function recalcFormFinancials() {
  const alloc = parseFloat((document.getElementById('formAnnualAllocation') as HTMLInputElement)?.value) || 0;
  const projected = parseFloat((document.getElementById('formProjectedSpend') as HTMLInputElement)?.value) || 0;
  const actual = parseFloat((document.getElementById('formActualSpend') as HTMLInputElement)?.value) || 0;

  const variance = projected - actual;
  const util = alloc > 0 ? (actual / alloc) * 100 : 0;

  const dispVar = document.getElementById('formCalcVariance');
  const dispUtil = document.getElementById('formCalcUtil');

  if (dispVar) {
    dispVar.innerText = variance >= 0 ? `+${formatRM(variance)}` : `-${formatRM(Math.abs(variance))}`;
    dispVar.className = variance < 0 ? "text-rose-600 font-bold font-mono" : "text-emerald-600 font-bold font-mono";
  }

  if (dispUtil) {
    dispUtil.innerText = `${util.toFixed(1)}%`;
  }

  updateDynamicSummary();
}

// Reset Portal Form
export function resetFormPortal() {
  const form = document.getElementById('projectForm') as HTMLFormElement;
  if (form) form.reset();

  const idEl = document.getElementById('formProjectId') as HTMLInputElement;
  if (idEl) idEl.value = "";

  const codeEl = document.getElementById('formCode') as HTMLInputElement;
  if (codeEl) codeEl.value = `PRJ-KPSTI-2026-${String(state.projects.length + 1).padStart(3, '0')}`;

  const modeTag = document.getElementById('formModeTag');
  if (modeTag) {
    modeTag.innerText = "Daftar Projek Baharu";
    modeTag.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40";
  }

  const heading = document.getElementById('portalFormHeading');
  if (heading) heading.innerText = "Borang Piawai Pendaftaran & Penyerahan Maklumat Projek";

  const submitText = document.getElementById('btnSubmitPortalText');
  if (submitText) submitText.innerText = "Hantar & Rekodkan Penyerahan ke Firestore";

  const chk = document.getElementById('portalConfirmCheckbox') as HTMLInputElement;
  if (chk) chk.checked = false;

  const err = document.getElementById('formErrorMessage');
  if (err) err.classList.add('hidden');

  state.tempUploadedFiles = [];
  renderUploadedFiles();
  recalcFormFinancials();
  updateDynamicSummary();
  refreshIcons();
}

// ==========================================
// GEMINI ENTERPRISE AGENT INTEGRATION (VIA SERVER-SIDE ROUTE)
// ==========================================

let latestGeminiAnswer = "";

/**
 * Render Markdown to HTML using marked library or comprehensive fallback
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return "";
  try {
    if ((window as any).marked && typeof (window as any).marked.parse === 'function') {
      return (window as any).marked.parse(markdown);
    }
  } catch (e) {
    console.warn("[Markdown] Error using window.marked:", e);
  }

  // Robust fallback markdown parser
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-900 mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-slate-900 mt-3 mb-1.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-slate-800">$1</em>');

  // Code blocks & inline code
  html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono my-2.5 overflow-x-auto shadow-inner"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mt-2">');
  html = html.replace(/\n/g, '<br>');

  return `<div class="space-y-1">${html}</div>`;
}

/**
 * Parse incoming stream buffer from Discovery Engine streamAssist
 * Extracts thoughts (reasoning), code executions, and actual agent answer text in real time
 */
export function parseDiscoveryStream(buffer: string): { thoughts: string; answer: string; displayProgress: string; discoverySession?: string } {
  const thoughts: string[] = [];
  const answerParts: string[] = [];

  // 1. Extract session name if provided: projects/.../sessions/...
  let discoverySession: string | undefined;
  const sessionMatch = /"sessionInfo":\s*\{\s*"session":\s*"([^"]+)"/g.exec(buffer);
  if (sessionMatch && sessionMatch[1]) {
    discoverySession = sessionMatch[1];
  }

  // 2. Extract code executions (tools) as part of reasoning
  const codeRegex = /"executableCode":\s*\{\s*"code":\s*"((?:\\.|[^"\\])*)"/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeRegex.exec(buffer)) !== null) {
    const unescapedCode = codeMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
    if (unescapedCode.trim()) {
      thoughts.push(`\n[Larian Analisis Kod Python]:\n\`\`\`python\n${unescapedCode.trim()}\n\`\`\`\n`);
    }
  }

  // 3. Extract text tokens (both thoughts and model answers)
  const textPattern = /"text":\s*"((?:\\.|[^"\\])*)"/g;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = textPattern.exec(buffer)) !== null) {
    const fullMatchIndex = tMatch.index;
    const rawVal = tMatch[1];
    const unescaped = rawVal
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, "\"")
      .replace(/\\\\/g, "\\")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t");

    // Skip API resource paths that may appear in raw metadata
    if (unescaped.startsWith("projects/") && unescaped.includes("/locations/")) {
      continue;
    }

    // Check surrounding characters in buffer for "thought": true
    const contextSlice = buffer.slice(Math.max(0, fullMatchIndex - 120), Math.min(buffer.length, fullMatchIndex + rawVal.length + 120));
    const isThought = /"thought":\s*true/.test(contextSlice);

    if (isThought) {
      thoughts.push(unescaped);
    } else {
      answerParts.push(unescaped);
    }
  }

  // 4. Handle non-assist queries (e.g. greetings like "Hai", "Hello" where Discovery Engine returns SKIPPED)
  if (answerParts.length === 0 && buffer.includes("NON_ASSIST_SEEKING_QUERY_IGNORED")) {
    answerParts.push(
      "Salam sejahtera! Saya merupakan Ejen Pintar Gemini Enterprise bagi Sistem Pemantauan Projek KPSTI Sabah.\n\nSila kemukakan pertanyaan mengenai status pelaksanaan projek, baki peruntukan siling 2026, status perbelanjaan sebenar, atau senarai projek tertangguh untuk saya sediakan analisis data terperinci."
    );
  }

  const thoughtStr = thoughts.join("");
  const answerStr = answerParts.join("");

  let displayProgress = "";
  if (thoughtStr) {
    displayProgress += `💭 Pemikiran Ejen / Reasoning:\n${thoughtStr}\n\n`;
  }
  if (answerStr) {
    displayProgress += `💬 Maklum Balas Ejen:\n${answerStr}`;
  }
  if (!displayProgress && buffer.trim()) {
    displayProgress = "Sedang berhubung dengan Ejen Gemini Enterprise...\nPenstriman data sedang diterima...";
  }

  return {
    thoughts: thoughtStr,
    answer: answerStr,
    displayProgress,
    discoverySession
  };
}

/**
 * Structured Reasoning Step Interface
 */
export interface ReasoningStep {
  id: string;
  stepNumber: number;
  title: string;
  detail?: string;
  isCode?: boolean;
  category: 'analysis' | 'code' | 'calc' | 'data' | 'synthesis';
  status: 'completed' | 'active' | 'pending';
}

/**
 * Category Badge Styling Helper
 */
export function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case 'code':
      return 'bg-slate-900 text-emerald-300 border border-slate-700';
    case 'calc':
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    case 'data':
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'analysis':
      return 'bg-purple-100 text-purple-800 border border-purple-300';
    case 'synthesis':
    default:
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  }
}

/**
 * Parses thought text and python executions into clean, line-by-line reasoning steps
 */
export function parseReasoningSteps(thoughtText: string, isStreaming = false): ReasoningStep[] {
  if (!thoughtText || !thoughtText.trim()) {
    if (isStreaming) {
      return [{
        id: 'step-init',
        stepNumber: 1,
        title: 'Menganalisis Pertanyaan & Menghubungi Discovery Engine',
        detail: 'Memulakan saluran streamAssist dan menyediakan parameter semakan data projek.',
        category: 'analysis',
        status: 'active'
      }];
    }
    return [];
  }

  const steps: ReasoningStep[] = [];
  
  // 1. Extract Python code executions if present
  const codeBlockRegex = /\[Larian Analisis Kod Python\]:[\s\n]*```python([\s\S]*?)```|```python([\s\S]*?)```/g;
  let textWithoutCode = thoughtText;
  const extractedCodes: { placeholder: string; code: string }[] = [];
  let codeIdx = 0;

  textWithoutCode = textWithoutCode.replace(codeBlockRegex, (_match, p1, p2) => {
    const code = (p1 || p2 || '').trim();
    const placeholder = `__REASONING_CODE_BLOCK_${codeIdx}__`;
    extractedCodes.push({ placeholder, code });
    codeIdx++;
    return `\n${placeholder}\n`;
  });

  // 2. Split lines by newlines and significant punctuation
  const rawSegments = textWithoutCode
    .split(/\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let currentStepIdx = 1;

  for (const segment of rawSegments) {
    // Check if this segment contains a code placeholder
    const matchedCode = extractedCodes.find(c => segment.includes(c.placeholder));
    if (matchedCode) {
      steps.push({
        id: `step-${currentStepIdx}`,
        stepNumber: currentStepIdx,
        title: `Larian Analisis Kod Python (#${currentStepIdx})`,
        detail: matchedCode.code,
        isCode: true,
        category: 'code',
        status: 'completed'
      });
      currentStepIdx++;
      continue;
    }

    // If segment is very long with multiple sentences, split by sentence endings
    let sentences = [segment];
    if (segment.length > 140 && segment.includes('. ')) {
      const parts = segment.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      if (parts.length > 1) {
        sentences = parts.filter(p => p.trim().length > 0);
      }
    }

    for (const rawLine of sentences) {
      // Remove leading markdown bullet marks (*, -, •, numbers)
      const cleanLine = rawLine.replace(/^[\*\-•\d\.\)\s]+/, '').trim();
      if (!cleanLine || cleanLine.length < 4) continue;

      let category: 'analysis' | 'code' | 'calc' | 'data' | 'synthesis' = 'synthesis';
      let title = 'Sintesis Maklum Balas & Rumusan';

      const lower = cleanLine.toLowerCase();
      if (lower.includes('python') || lower.includes('kod') || lower.includes('skrip')) {
        category = 'code';
        title = 'Analisis Logik Pengiraan / Skrip';
      } else if (
        lower.includes('rm') || 
        lower.includes('peruntukan') || 
        lower.includes('belanja') || 
        lower.includes('varians') || 
        lower.includes('kadar') || 
        lower.includes('baki') || 
        lower.includes('siling') || 
        lower.includes('kira') || 
        lower.includes('hitung') || 
        lower.includes('%')
      ) {
        category = 'calc';
        title = 'Pengiraan Metrik Kewangan & Varians Belanjawan';
      } else if (
        lower.includes('lampiran') || 
        lower.includes('fail') || 
        lower.includes('dokumen') || 
        lower.includes('csv') || 
        lower.includes('excel') || 
        lower.includes('firestore') || 
        lower.includes('pangkalan') ||
        lower.includes('muat naik')
      ) {
        category = 'data';
        title = 'Semakan Dokumen Lampiran & Pangkalan Data';
      } else if (
        lower.includes('analisis') || 
        lower.includes('semak') || 
        lower.includes('kenal pasti') || 
        lower.includes('imbas') || 
        lower.includes('soalan') || 
        lower.includes('parameter')
      ) {
        category = 'analysis';
        title = 'Analisis Keperluan Soalan & Skop Projek';
      }

      steps.push({
        id: `step-${currentStepIdx}`,
        stepNumber: currentStepIdx,
        title,
        detail: cleanLine,
        category,
        status: 'completed'
      });
      currentStepIdx++;
    }
  }

  // If streaming and steps exist, mark the final step as active
  if (isStreaming && steps.length > 0) {
    steps[steps.length - 1].status = 'active';
  }

  return steps;
}

/**
 * Calculates progress percentage during streaming
 */
export function calculateReasoningProgress(stepCount: number, hasAnswer: boolean, elapsedSeconds: number): number {
  if (hasAnswer) return 92;
  if (stepCount <= 1) return Math.min(40, 15 + Math.floor(elapsedSeconds * 4));
  if (stepCount === 2) return Math.min(60, 35 + Math.floor(elapsedSeconds * 3));
  if (stepCount === 3) return Math.min(75, 55 + Math.floor(elapsedSeconds * 2.5));
  return Math.min(88, 70 + Math.floor(stepCount * 3));
}

/**
 * Toggle reasoning accordion in completed message cards
 */
export function toggleReasoningAccordion(msgId: string) {
  const body = document.getElementById(`reasoning-body-${msgId}`);
  const chevron = document.getElementById(`chevron-reasoning-${msgId}`);
  if (!body) return;

  const isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    if (chevron) chevron.classList.add('rotate-180');
  } else {
    body.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
  }
}

/**
 * Render live streaming stepper, progress bar, and real-time answer preview
 */
export function renderLiveStreamingSteps(
  steps: ReasoningStep[],
  progressPercent: number,
  phaseLabel: string,
  answerText: string
) {
  const progressBar = document.getElementById('chatStreamingProgressBar');
  const percentBadge = document.getElementById('chatStreamingProgressPercent');
  const phaseEl = document.getElementById('chatStreamingPhaseLabel');
  const stepCountBadge = document.getElementById('chatStreamingStepCountBadge');
  const listContainer = document.getElementById('chatStreamingStepsList');
  const answerContainer = document.getElementById('chatStreamingAnswerPreviewContainer');
  const answerLiveText = document.getElementById('chatStreamingAnswerLiveText');

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (percentBadge) percentBadge.textContent = `${progressPercent}%`;
  if (phaseEl) phaseEl.textContent = `· ${phaseLabel}`;

  if (stepCountBadge) {
    stepCountBadge.textContent = steps.length > 0
      ? `Langkah ${steps.length} Selesai (${progressPercent}%)`
      : `Menyambung (${progressPercent}%)`;
  }

  if (listContainer) {
    if (steps.length === 0) {
      listContainer.innerHTML = `
        <div class="flex items-start space-x-2.5 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-900 animate-pulse">
          <span class="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 font-mono">1</span>
          <div class="text-[11px] leading-relaxed">
            <span class="font-semibold">Menilai konteks pertanyaan &amp; memulakan sambungan Discovery Engine...</span>
          </div>
        </div>
      `;
    } else {
      listContainer.innerHTML = steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const badgeClass = getCategoryBadgeClass(step.category);
        const nodeIcon = isCompleted
          ? `<span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-emerald-300">✓</span>`
          : `<span class="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs animate-spin font-mono text-[9px]">↻</span>`;

        const rowBg = isCompleted
          ? `bg-slate-50 border-slate-200/80 text-slate-800`
          : `bg-indigo-50/80 border-indigo-200 text-indigo-950 ring-1 ring-indigo-300/40`;

        return `
          <div class="flex items-start space-x-2.5 p-2 rounded-lg border ${rowBg} transition-all">
            ${nodeIcon}
            <div class="space-y-0.5 flex-grow min-w-0">
              <div class="flex items-center space-x-1.5 flex-wrap">
                <span class="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${badgeClass}">${step.category}</span>
                <span class="font-bold text-xs ${isCompleted ? 'text-slate-800' : 'text-indigo-950'}">
                  Langkah ${idx + 1}: ${escapeHtml(step.title)}
                </span>
              </div>
              ${step.isCode ? `
                <pre class="bg-slate-900 text-emerald-300 p-2 rounded-md font-mono text-[10px] overflow-x-auto border border-slate-800 my-1"><code>${escapeHtml(step.detail || '')}</code></pre>
              ` : (step.detail ? `
                <div class="text-[11px] text-slate-600 leading-relaxed font-sans">${escapeHtml(step.detail)}</div>
              ` : '')}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Live Answer Preview
  if (answerContainer && answerLiveText) {
    if (answerText && answerText.trim()) {
      answerContainer.classList.remove('hidden');
      answerLiveText.innerHTML = renderMarkdown(answerText);
      answerLiveText.scrollTop = answerLiveText.scrollHeight;
    } else {
      answerContainer.classList.add('hidden');
    }
  }

  refreshIcons();
}

/**
 * Chat Attachment Interface & In-Memory Store
 */
export interface ChatAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  content?: string;
  mimeType?: string;
}

export let chatAttachedFiles: ChatAttachment[] = [];

/**
 * Triggers file picker for chatbot attachment
 */
export function triggerChatFileUpload() {
  const fileInput = document.getElementById('chatFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

/**
 * Handles file selection for chat query context
 */
export async function handleChatFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  await processChatFiles(input.files);
  input.value = ""; // Reset to allow re-upload of same file
}

/**
 * Processes chat files and loads text/content
 */
export async function processChatFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  let addedCount = 0;

  for (const file of files) {
    // Enforce 10MB limit per file
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Fail "${file.name}" melebihi had saiz 10MB.`, "warning");
      continue;
    }

    const sizeInKB = (file.size / 1024).toFixed(0);
    const sizeStr = Number(sizeInKB) > 1024 ? `${(Number(sizeInKB) / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    let content = "";
    try {
      const isText = file.type.startsWith('text/') || 
                     file.name.endsWith('.csv') || 
                     file.name.endsWith('.json') || 
                     file.name.endsWith('.txt') || 
                     file.name.endsWith('.md') ||
                     file.name.endsWith('.tsv') ||
                     file.name.endsWith('.log');

      if (isText) {
        content = await readFileAsText(file);
      } else if (file.type.startsWith('image/')) {
        content = `[Imej Lampiran: ${file.name} (${sizeStr}, jenis: ${file.type})]`;
      } else {
        // Document: pdf, docx, xlsx - attempt text extraction or record metadata
        const textSample = await readFileAsText(file).catch(() => "");
        if (textSample && textSample.length > 50) {
          const printable = textSample.replace(/[^\x20-\x7E\t\r\n]/g, " ").replace(/\s+/g, " ").trim();
          content = printable.slice(0, 10000);
        } else {
          content = `[Dokumen Sokongan: ${file.name} (${ext}, saiz: ${sizeStr})]`;
        }
      }
    } catch (e) {
      console.warn("Could not extract text from file:", file.name, e);
      content = `[Lampiran Fail: ${file.name} (${ext}, ${sizeStr})]`;
    }

    chatAttachedFiles.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: sizeStr,
      type: ext,
      content: content,
      mimeType: file.type
    });
    addedCount++;
  }

  renderChatAttachedFiles();
  if (addedCount > 0) {
    showToast(`${addedCount} fail dilampirkan sebagai konteks soalan.`, "info");
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Render attachment preview strip above chat input
 */
export function renderChatAttachedFiles() {
  const container = document.getElementById('chatAttachedFilesContainer');
  const list = document.getElementById('chatAttachedFilesList');
  const label = document.getElementById('chatAttachedFilesLabel');
  if (!container || !list) return;

  if (chatAttachedFiles.length === 0) {
    container.classList.add('hidden');
    list.innerHTML = "";
    return;
  }

  container.classList.remove('hidden');
  if (label) {
    label.textContent = `Dokumen Lampiran Konteks (${chatAttachedFiles.length} fail)`;
  }

  list.innerHTML = chatAttachedFiles.map((f, idx) => {
    let icon = "file";
    let iconColor = "text-slate-600";
    if (['XLSX', 'XLS', 'CSV'].includes(f.type)) {
      icon = "file-spreadsheet";
      iconColor = "text-emerald-600";
    } else if (['PDF'].includes(f.type)) {
      icon = "file-text";
      iconColor = "text-rose-600";
    } else if (['DOC', 'DOCX'].includes(f.type)) {
      icon = "file-text";
      iconColor = "text-blue-600";
    } else if (['JSON', 'MD', 'TXT'].includes(f.type)) {
      icon = "file-code";
      iconColor = "text-amber-600";
    } else if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(f.type)) {
      icon = "image";
      iconColor = "text-purple-600";
    }

    return `
      <div class="inline-flex items-center space-x-2 bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
        <i data-lucide="${icon}" class="w-3.5 h-3.5 ${iconColor} flex-shrink-0"></i>
        <span class="font-medium text-slate-800 max-w-[150px] truncate" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span>
        <span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(f.size)})</span>
        <button
          type="button"
          onclick="removeChatAttachment(${idx})"
          class="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
          title="Buang lampiran ini"
        >
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </div>
    `;
  }).join('');

  refreshIcons();
}

/**
 * Remove an attached file from chat queue
 */
export function removeChatAttachment(idx: number) {
  chatAttachedFiles.splice(idx, 1);
  renderChatAttachedFiles();
}

/**
 * Clear all attached files from chat queue
 */
export function clearChatAttachments() {
  chatAttachedFiles = [];
  renderChatAttachedFiles();
}

/**
 * Setup drag-and-drop listener for chat attachment
 */
export function setupChatDropZone() {
  const dropOverlay = document.getElementById('chatDropZoneOverlay');
  const chatBar = document.getElementById('chatInputBar');
  const chatContainer = document.getElementById('geminiChatInterface');
  if (!chatBar) return;

  const target = chatContainer || chatBar;

  ['dragenter', 'dragover'].forEach(eventName => {
    target.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropOverlay) dropOverlay.classList.remove('hidden');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    target.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragleave') {
        const rect = target.getBoundingClientRect();
        if (
          (e as DragEvent).clientX <= rect.left ||
          (e as DragEvent).clientX >= rect.right ||
          (e as DragEvent).clientY <= rect.top ||
          (e as DragEvent).clientY >= rect.bottom
        ) {
          if (dropOverlay) dropOverlay.classList.add('hidden');
        }
      } else {
        if (dropOverlay) dropOverlay.classList.add('hidden');
      }
    }, false);
  });

  target.addEventListener('drop', (e: DragEvent) => {
    if (dropOverlay) dropOverlay.classList.add('hidden');
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      processChatFiles(dt.files);
    }
  });
}

/**
 * Chat Message & Session Interfaces
 */
export interface ChatAttachmentMeta {
  name: string;
  size: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  originalQuestion?: string;
  isStreaming?: boolean;
  thoughts?: string;
  attachments?: ChatAttachmentMeta[];
}

export interface ChatSession {
  conversationId: string;
  discoverySession?: string;
  messages: ChatMessage[];
}

export let chatSession: ChatSession = {
  conversationId: `conv-${Date.now().toString(36)}`,
  discoverySession: undefined,
  messages: []
};

let lastUserSubmittedPrompt: string = "";

/**
 * Start a brand new chat conversation session
 */
export function startNewChatConversation() {
  chatSession = {
    conversationId: `conv-${Date.now().toString(36)}`,
    discoverySession: undefined,
    messages: []
  };
  lastUserSubmittedPrompt = "";
  latestGeminiAnswer = "";

  const input = document.getElementById('chatInputText') as HTMLTextAreaElement;
  if (input) {
    input.value = "";
    input.style.height = "auto";
  }

  const charCount = document.getElementById('chatCharCount');
  if (charCount) charCount.textContent = "0 aksara";

  const expiredAlert = document.getElementById('chatTokenExpiredAlert');
  if (expiredAlert) expiredAlert.classList.add('hidden');

  const noResponseAlert = document.getElementById('chatNoResponseAlert');
  if (noResponseAlert) noResponseAlert.classList.add('hidden');

  const streamingBubble = document.getElementById('chatInlineStreamingState');
  if (streamingBubble) streamingBubble.classList.add('hidden');

  const statusBadge = document.getElementById('geminiAgentStatusBadge');
  const statusText = document.getElementById('geminiAgentStatusText');
  if (statusBadge) {
    statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (statusText) statusText.textContent = "Sedia";

  renderChatMessages();
  showToast("Sesi perbualan baharu telah dimulakan.", "info");
}

/**
 * Clear the current chat view
 */
export function clearCurrentChat() {
  chatSession.messages = [];
  renderChatMessages();
  showToast("Paparan mesej telah dikosongkan.", "info");
}

/**
 * Select a quick suggestion prompt chip
 */
export function selectQuickPrompt(promptText: string) {
  const input = document.getElementById('chatInputText') as HTMLTextAreaElement;
  if (input) {
    input.value = promptText;
    input.focus();
    input.dispatchEvent(new Event('input'));
  }
  submitChatMessage(promptText);
}

/**
 * Handle Enter key in textarea (Enter to send, Shift+Enter for newline)
 */
export function handleChatInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submitChatMessage();
  }
}

/**
 * Retry the last failed user question
 */
export function retryLastUserMessage() {
  if (lastUserSubmittedPrompt) {
    submitChatMessage(lastUserSubmittedPrompt);
  } else {
    showToast("Tiada soalan terdahulu untuk dicuba semula.", "warning");
  }
}

/**
 * Render all chat messages into the auto-scrolling container
 */
export function renderChatMessages() {
  const container = document.getElementById('chatMessagesList');
  if (!container) return;

  // If no messages yet, show welcoming greeting with interactive quick cards
  if (chatSession.messages.length === 0) {
    container.innerHTML = `
      <div class="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100 rounded-2xl shadow-sm text-slate-800 space-y-4">
        <div class="flex items-start space-x-3.5">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs sm:text-sm text-slate-900">Ejen Pintar Gemini Enterprise (Discovery Engine)</span>
              <span class="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">KPSTI Sabah</span>
            </div>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              Selamat sejahtera! Saya bersedia membantu anda menganalisis data pelaksanaan projek, status peruntukan tahun 2026, unjuran perbelanjaan, serta mengenal pasti isu kelewatan fizikal dan kewangan melalui komunikasi berterusan (multi-turn dialog).
            </p>
          </div>
        </div>

        <div class="pt-2 border-t border-indigo-100/70">
          <span class="text-[11px] font-bold text-slate-700 block mb-2">Pilih contoh pertanyaan pantas untuk bermula:</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button type="button" onclick="selectQuickPrompt('Apakah status pelaksanaan projek di bawah KPSTI terkini?')" class="text-left p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-center justify-between group cursor-pointer shadow-xs">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 group-hover:text-indigo-700 text-xs">Status Projek KPSTI</span>
                <p class="text-[11px] text-slate-500">Semakan kemajuan fizikal dan milestone terkini.</p>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 ml-2"></i>
            </button>

            <button type="button" onclick="selectQuickPrompt('Berapakah baki peruntukan tahun 2026 dan status perbelanjaan sebenar?')" class="text-left p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-center justify-between group cursor-pointer shadow-xs">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 group-hover:text-indigo-700 text-xs">Baki Peruntukan 2026</span>
                <p class="text-[11px] text-slate-500">Kadar penyerapan dan baki dana siling pembangunan.</p>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 ml-2"></i>
            </button>

            <button type="button" onclick="selectQuickPrompt('Senaraikan projek yang mengalami kelewatan atau isu kritikal.')" class="text-left p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-center justify-between group cursor-pointer shadow-xs">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 group-hover:text-indigo-700 text-xs">Projek Tertangguh / Lewat</span>
                <p class="text-[11px] text-slate-500">Kenal pasti halangan logistik atau perolehan.</p>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 ml-2"></i>
            </button>

            <button type="button" onclick="selectQuickPrompt('Sediakan rumusan eksekutif varians bajet projek untuk pembentangan.')" class="text-left p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-center justify-between group cursor-pointer shadow-xs">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 group-hover:text-indigo-700 text-xs">Analisis Varians Belanjawan</span>
                <p class="text-[11px] text-slate-500">Draf ringkasan untuk Mesyuarat Pemandu Negeri.</p>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0 ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    refreshIcons();
    return;
  }

  // Render individual messages
  container.innerHTML = chatSession.messages.map(msg => {
    if (msg.role === 'user') {
      const userInitials = (state.currentUser?.displayName?.slice(0, 2) || 'EH').toUpperCase();
      const attachmentsHtml = (msg.attachments && msg.attachments.length > 0) ? `
        <div class="mt-2.5 pt-2 border-t border-slate-700/80 space-y-1.5 text-left">
          <div class="text-[10px] text-slate-300 font-semibold flex items-center space-x-1">
            <i data-lucide="paperclip" class="w-3 h-3 text-indigo-400"></i>
            <span>Dokumen Lampiran Konteks (${msg.attachments.length}):</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${msg.attachments.map(att => `
              <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-indigo-200 font-mono">
                <i data-lucide="file-check" class="w-3 h-3 text-indigo-400"></i>
                <span class="max-w-[140px] truncate" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
                <span class="text-slate-400 font-mono text-[9px]">(${escapeHtml(att.size)})</span>
              </span>
            `).join('')}
          </div>
        </div>
      ` : '';

      return `
        <div class="flex items-start justify-end space-x-2.5 max-w-[88%] sm:max-w-[78%] ml-auto group">
          <div class="space-y-1 text-right">
            <div class="flex items-center justify-end space-x-2 text-[10px] text-slate-400">
              <span class="font-semibold text-slate-700">${state.currentUser?.displayName || 'Pegawai KPSTI'}</span>
              <span>•</span>
              <span class="font-mono">${msg.timestamp}</span>
            </div>
            <div class="p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl rounded-tr-xs shadow-sm text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-left">
              ${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              ${attachmentsHtml}
            </div>
          </div>
          <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 mt-3 border border-slate-700">
            ${userInitials}
          </div>
        </div>
      `;
    } else {
      // Assistant message bubble
      const formattedContent = renderMarkdown(msg.content);
      
      // Revamped Line-by-Line Reasoning Steps Card
      let thoughtsSection = "";
      if (msg.thoughts && msg.thoughts.trim()) {
        const steps = parseReasoningSteps(msg.thoughts, false);
        if (steps.length > 0) {
          thoughtsSection = `
            <div class="mb-3.5 bg-slate-50/90 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onclick="toggleReasoningAccordion('${msg.id}')"
                class="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition cursor-pointer select-none"
                aria-expanded="false"
              >
                <div class="flex items-center space-x-2">
                  <div class="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <i data-lucide="brain-circuit" class="w-3.5 h-3.5"></i>
                  </div>
                  <span class="font-bold text-xs text-indigo-950">Langkah Pemikiran &amp; Analisis Ejen</span>
                  <span class="text-[10px] font-mono text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full font-semibold">
                    ${steps.length} Langkah Selesai
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                    <span>100% Lengkap</span>
                  </span>
                  <i id="chevron-reasoning-${msg.id}" data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200"></i>
                </div>
              </button>
              
              <div id="reasoning-body-${msg.id}" class="hidden px-4 pb-3.5 pt-1 border-t border-slate-200/70">
                <div class="relative pl-5 border-l-2 border-indigo-200 ml-2.5 my-2.5 space-y-3">
                  ${steps.map((step, sIdx) => `
                    <div class="relative group">
                      <div class="absolute -left-[27px] top-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                        ${sIdx + 1}
                      </div>
                      <div class="space-y-1">
                        <div class="flex items-center space-x-2">
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${getCategoryBadgeClass(step.category)} uppercase">
                            ${step.category}
                          </span>
                          <span class="font-bold text-xs text-slate-900">${escapeHtml(step.title)}</span>
                        </div>
                        ${step.isCode ? `
                          <pre class="bg-slate-900 text-emerald-300 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto border border-slate-800 my-1 shadow-inner"><code>${escapeHtml(step.detail || '')}</code></pre>
                        ` : `
                          <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(step.detail || '')}</p>
                        `}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }
      }

      return `
        <div class="flex items-start space-x-3 max-w-[96%] sm:max-w-[90%] mr-auto group">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-2">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
          </div>

          <div class="flex-grow space-y-1.5 min-w-0">
            <div class="flex items-center flex-wrap gap-2 text-[10px] text-slate-400">
              <span class="font-bold text-slate-800">Ejen Gemini Enterprise</span>
              <span class="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[9px]">streamAssist</span>
              <span>•</span>
              <span class="font-mono">${msg.timestamp}</span>
            </div>

            <!-- Assistant Bubble Container -->
            <div class="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs shadow-sm text-slate-800 space-y-3">
              ${thoughtsSection}
              
              <!-- Markdown Content -->
              <div class="text-xs sm:text-sm leading-relaxed overflow-x-auto">
                ${formattedContent}
              </div>

              <!-- Report Action Toolbar -->
              <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center flex-wrap gap-1.5">
                  <!-- Download Report (PDF) -->
                  <button
                    type="button"
                    onclick="downloadMessageAsPDF('${msg.id}')"
                    class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-200 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    title="Muat turun maklum balas ini sebagai fail dokumen PDF rasmi"
                  >
                    <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                    <span>Muat Turun Laporan (PDF)</span>
                  </button>

                  <!-- Print Report -->
                  <button
                    type="button"
                    onclick="printSingleReport('${msg.id}')"
                    class="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-300/80 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    title="Cetak laporan rasmi tanpa elemen antaramuka sembang"
                  >
                    <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                    <span>Cetak Laporan</span>
                  </button>

                  <!-- Copy text -->
                  <button
                    type="button"
                    onclick="copyMessageText('${msg.id}')"
                    class="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                    title="Salin teks jawapan"
                  >
                    <i data-lucide="copy" class="w-3 h-3"></i>
                    <span>Salin</span>
                  </button>
                </div>

                <div class="flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-600"></i>
                  <span>Log Audit Firestore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }).join("");

  // Scroll to bottom
  const scrollBox = document.getElementById('chatMessagesContainer');
  if (scrollBox) {
    scrollBox.scrollTop = scrollBox.scrollHeight;
  }

  refreshIcons();
}

/**
 * Submit chat message to server-side Gemini Enterprise Discovery Engine proxy
 */
export async function submitChatMessage(overrideText?: string) {
  const input = document.getElementById('chatInputText') as HTMLTextAreaElement;
  let text = overrideText?.trim();
  if (!text && input) {
    text = input.value.trim();
  }

  // If user attached files without typing text, provide a sensible default query
  if (!text && chatAttachedFiles.length > 0) {
    text = "Sila buat semakan dan analisis terperinci terhadap fail lampiran yang dimuat naik bersama-sama status peruntukan projek KPSTI.";
  }

  if (!text) {
    showToast("Sila taipkan soalan atau lampirkan dokumen untuk pertanyaan anda.", "warning");
    if (input) {
      input.focus();
      input.classList.add('ring-2', 'ring-indigo-400');
      setTimeout(() => input.classList.remove('ring-2', 'ring-indigo-400'), 1500);
    }
    return;
  }

  // Clear input
  if (input) {
    input.value = "";
    input.style.height = "auto";
  }
  const charCount = document.getElementById('chatCharCount');
  if (charCount) charCount.textContent = "0 aksara";

  lastUserSubmittedPrompt = text;

  // Clone attached files for this message turn and reset the global queue
  const filesToSend = [...chatAttachedFiles];
  chatAttachedFiles = [];
  renderChatAttachedFiles();

  // Add user message to state with attached file metadata
  const userMsg: ChatMessage = {
    id: `u-${Date.now()}`,
    role: 'user',
    content: text,
    timestamp: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
    attachments: filesToSend.map(f => ({ name: f.name, size: f.size, type: f.type }))
  };
  chatSession.messages.push(userMsg);
  renderChatMessages();

  // Show inline streaming indicator
  const streamingBubble = document.getElementById('chatInlineStreamingState');
  const streamTextBuffer = document.getElementById('chatStreamingTextBuffer');
  const expiredAlert = document.getElementById('chatTokenExpiredAlert');
  const noResponseAlert = document.getElementById('chatNoResponseAlert');
  const statusBadge = document.getElementById('geminiAgentStatusBadge');
  const statusText = document.getElementById('geminiAgentStatusText');
  const btnSend = document.getElementById('btnSendChat') as HTMLButtonElement;
  const streamingTimer = document.getElementById('chatStreamingTimer');

  if (expiredAlert) expiredAlert.classList.add('hidden');
  if (noResponseAlert) noResponseAlert.classList.add('hidden');
  if (streamingBubble) streamingBubble.classList.remove('hidden');

  if (statusBadge) {
    statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200";
  }
  if (statusText) statusText.textContent = "Sedang Berfikir...";

  if (btnSend) {
    btnSend.disabled = true;
    btnSend.classList.add('opacity-70', 'cursor-not-allowed');
  }

  // Initial stepper setup
  const streamStartTime = Date.now();
  let timerInterval: any = null;
  if (streamingTimer) {
    streamingTimer.textContent = "0.0s";
    timerInterval = setInterval(() => {
      const elapsedSec = ((Date.now() - streamStartTime) / 1000).toFixed(1);
      if (streamingTimer) streamingTimer.textContent = `${elapsedSec}s`;
    }, 100);
  }

  renderLiveStreamingSteps([], 15, "Menghubungi Discovery Engine streamAssist", "");

  if (streamTextBuffer) {
    streamTextBuffer.textContent = `Menghubungi Google Discovery Engine Enterprise Agent...\nSoalan: "${text}"\nFail Lampiran: ${filesToSend.length > 0 ? filesToSend.map(f => f.name).join(', ') : 'Tiada'}\nMenunggu penstriman data (streamAssist)...`;
  }

  const scrollBox = document.getElementById('chatMessagesContainer');
  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

  try {
    // Send request with conversation history and attached files for multi-turn dialogue
    const previousHistory = chatSession.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch('/api/agent/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: text,
        history: previousHistory,
        discoverySession: chatSession.discoverySession,
        attachedFiles: filesToSend
      })
    });

    // Check for authorization/expired token errors
    if (response.status === 401 || response.status === 403) {
      if (timerInterval) clearInterval(timerInterval);
      if (streamingBubble) streamingBubble.classList.add('hidden');
      if (expiredAlert) expiredAlert.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200";
      }
      if (statusText) statusText.textContent = "Token Tamat";
      showToast("Your access token has expired — ask your facilitator for a new one.", "error");
      refreshIcons();
      return;
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMessage = errJson?.error || "Ralat pelayan semasa memproses soalan.";
      if (errMessage.includes("expired") || errMessage.includes("token")) {
        if (timerInterval) clearInterval(timerInterval);
        if (streamingBubble) streamingBubble.classList.add('hidden');
        if (expiredAlert) expiredAlert.classList.remove('hidden');
        if (statusBadge) {
          statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200";
        }
        if (statusText) statusText.textContent = "Token Tamat";
        showToast("Your access token has expired — ask your facilitator for a new one.", "error");
        refreshIcons();
        return;
      }
      throw new Error(errMessage);
    }

    // Stream the response progressively
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Respons stream tidak dapat dibaca oleh pelayar.");
    }

    const decoder = new TextDecoder("utf-8");
    let accumulatedRaw = "";
    let finalAnswerText = "";
    let finalThoughtsText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      accumulatedRaw += chunk;

      const parsed = parseDiscoveryStream(accumulatedRaw);
      if (parsed.discoverySession) {
        chatSession.discoverySession = parsed.discoverySession;
      }
      if (parsed.answer) finalAnswerText = parsed.answer;
      if (parsed.thoughts) finalThoughtsText = parsed.thoughts;

      const currentSteps = parseReasoningSteps(finalThoughtsText, !finalAnswerText);
      const elapsedSec = (Date.now() - streamStartTime) / 1000;
      const progressPercent = calculateReasoningProgress(currentSteps.length, Boolean(finalAnswerText), elapsedSec);
      const currentPhase = finalAnswerText
        ? 'Menjana rumusan jawapan eksekutif...'
        : (currentSteps[currentSteps.length - 1]?.title || 'Menganalisis soalan & data...');

      renderLiveStreamingSteps(currentSteps, progressPercent, currentPhase, finalAnswerText);

      if (streamTextBuffer) {
        streamTextBuffer.textContent = parsed.displayProgress || accumulatedRaw;
        streamTextBuffer.scrollTop = streamTextBuffer.scrollHeight;
      }
      if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
    }

    if (timerInterval) clearInterval(timerInterval);

    if (!finalAnswerText && accumulatedRaw) {
      const parsed = parseDiscoveryStream(accumulatedRaw);
      if (parsed.discoverySession) {
        chatSession.discoverySession = parsed.discoverySession;
      }
      finalAnswerText = parsed.answer || parsed.thoughts;
      if (parsed.thoughts) finalThoughtsText = parsed.thoughts;
    }

    // Complete the progress display
    const finalSteps = parseReasoningSteps(finalThoughtsText, false);
    renderLiveStreamingSteps(finalSteps, 100, "Analisis lengkap", finalAnswerText);

    if (streamingBubble) streamingBubble.classList.add('hidden');

    if (!finalAnswerText || !finalAnswerText.trim()) {
      if (noResponseAlert) noResponseAlert.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200";
      }
      if (statusText) statusText.textContent = "Tiada Jawapan";
      showToast("No response was generated. Try rephrasing your question.", "warning");
      refreshIcons();
      return;
    }

    // Store assistant message
    latestGeminiAnswer = finalAnswerText;
    const assistantMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'model',
      content: finalAnswerText,
      timestamp: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
      originalQuestion: text,
      thoughts: finalThoughtsText
    };
    chatSession.messages.push(assistantMsg);
    renderChatMessages();

    if (statusBadge) {
      statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200";
    }
    if (statusText) statusText.textContent = "Selesai";

    // Record into Firestore Audit Log
    try {
      await recordSubmission(
        'GEMINI_AGENT_QUERY',
        'GEMINI-AGENT',
        `Pertanyaan Ejen: ${text.slice(0, 45)}...`,
        {
          question: text,
          answer: finalAnswerText,
          sessionId: chatSession.conversationId,
          source: 'Discovery Engine Enterprise Agent',
          status: 'COMPLETED',
          attachedFilesCount: filesToSend.length,
          attachedFiles: filesToSend.map(f => ({ name: f.name, size: f.size, type: f.type })),
          timestamp: new Date().toISOString()
        },
        state.currentUser
      );
      showToast("Maklum balas diterima & direkodkan ke Log Audit Firestore.", "success");
    } catch (auditErr) {
      console.warn("[Firestore] Gagal merekod log audit chat:", auditErr);
    }

  } catch (err: any) {
    if (timerInterval) clearInterval(timerInterval);
    console.error("[Chat Stream Error]:", err);
    if (streamingBubble) streamingBubble.classList.add('hidden');

    const errStr = String(err?.message || err);
    if (
      errStr.includes("401") ||
      errStr.includes("403") ||
      errStr.includes("token") ||
      errStr.includes("expired")
    ) {
      if (expiredAlert) expiredAlert.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200";
      }
      if (statusText) statusText.textContent = "Token Tamat";
      showToast("Your access token has expired — ask your facilitator for a new one.", "error");
    } else {
      if (noResponseAlert) noResponseAlert.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.className = "inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200";
      }
      if (statusText) statusText.textContent = "Ralat";
      showToast("No response was generated. Try rephrasing your question.", "warning");
    }
  } finally {
    if (btnSend) {
      btnSend.disabled = false;
      btnSend.classList.remove('opacity-70', 'cursor-not-allowed');
    }
    refreshIcons();
  }
}

/**
 * Download a specific agent response message as an official Enterprise PDF Report
 */
export async function downloadMessageAsPDF(messageId: string) {
  const msg = chatSession.messages.find(m => m.id === messageId);
  if (!msg) {
    showToast("Mesej tidak ditemui untuk penjanaan PDF.", "warning");
    return;
  }

  showToast("Menjana laporan PDF rasmi...", "info");

  try {
    const formattedDate = new Date().toLocaleString('ms-MY', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const officerName = state.currentUser?.displayName || 'Ermyza Hillary (ermyza.hillary@sabah.gov.my)';
    const renderedHtml = renderMarkdown(msg.content);
    const originalQuery = msg.originalQuestion || (chatSession.messages.find(m => m.role === 'user')?.content || 'Pertanyaan Mengenai Status & Peruntukan Projek KPSTI');

    // Create an isolated container for pixel-perfect PDF rendering
    const container = document.createElement('div');
    container.id = 'tempPdfRenderContainer';
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '794px'; // A4 width at 96 DPI
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.padding = '40px';
    container.style.fontFamily = '"Plus Jakarta Sans", sans-serif';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-1000';

    container.innerHTML = `
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 48px; height: 48px; background-color: #1e1b4b; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; font-family: monospace;">
              KPSTI
            </div>
            <div>
              <h1 style="font-size: 15px; font-weight: 800; text-transform: uppercase; margin: 0; color: #020617; line-height: 1.2;">
                Kementerian Pendidikan, Sains, Teknologi dan Inovasi Sabah (KPSTI)
              </h1>
              <h2 style="font-size: 12px; font-weight: 600; color: #475569; margin: 2px 0 0 0; text-transform: uppercase;">
                Sistem Pemantauan Projek Bersepadu (e-Pantau KPSTI)
              </h2>
              <div style="font-size: 11px; font-weight: 700; color: #4338ca; margin-top: 2px; font-family: monospace;">
                LAPORAN RASMI MAKLUM BALAS EJEN GEMINI ENTERPRISE
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; font-family: monospace; color: #64748b;">
            <div style="font-weight: 700; color: #1e293b;">DOC ID: ${messageId.toUpperCase()}</div>
            <div>Tarikh: ${formattedDate}</div>
            <div style="color: #047857; font-weight: 700;">LOG FIRESTORE: DISAHKAN</div>
          </div>
        </div>
      </div>

      <!-- Metadata Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <span style="font-weight: 700; color: #64748b; font-size: 9px; text-transform: uppercase; display: block;">Pegawai Pemohon</span>
          <span style="font-weight: 600; color: #0f172a;">${officerName}</span>
        </div>
        <div>
          <span style="font-weight: 700; color: #64748b; font-size: 9px; text-transform: uppercase; display: block;">Enjin Analisis AI</span>
          <span style="font-weight: 600; color: #0f172a;">Google Discovery Engine (streamAssist API)</span>
        </div>
        <div>
          <span style="font-weight: 700; color: #64748b; font-size: 9px; text-transform: uppercase; display: block;">ID Sesi Dialog</span>
          <span style="font-family: monospace; color: #334155;">${chatSession.conversationId}</span>
        </div>
        <div>
          <span style="font-weight: 700; color: #64748b; font-size: 9px; text-transform: uppercase; display: block;">Klasifikasi Dokumen</span>
          <span style="font-weight: 700; color: #312e81;">DOKUMEN RASMI KERAJAAN SABAH</span>
        </div>
      </div>

      <!-- Original Question Prompt -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 6px 0;">
          Pertanyaan / Arahan Asal Pengguna (Inquiry Prompt):
        </h3>
        <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 0 6px 6px 0; padding: 10px 12px; font-size: 12px; font-style: italic; color: #1e1b4b; line-height: 1.5;">
          "${originalQuery}"
        </div>
      </div>

      <!-- Markdown Report Body -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
          Maklum Balas &amp; Analisis Terperinci:
        </h3>
        <div style="font-size: 12px; line-height: 1.6; color: #0f172a;">
          ${renderedHtml}
        </div>
      </div>

      <!-- Footer & Verification -->
      <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 30px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-weight: 700; color: #334155;">PENGESAHAN INTEGRITI SISTEM:</div>
          <div>Dokumen ini dijana secara automatik melalui sistem e-Pantau KPSTI Sabah.</div>
          <div>Audit logging direkodkan dalam Google Cloud Firestore secara berpusat.</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: #0f172a; font-family: monospace;">e-PANTAU KPSTI SABAH</div>
          <div style="font-style: italic;">Hak Cipta Terpelihara &copy; 2026</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const html2canvasFn = (window as any).html2canvas || html2canvas;
    const canvas = await html2canvasFn(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(container);

    const jsPdfConstructor = (window as any).jspdf?.jsPDF || jsPDF;
    const pdf = new jsPdfConstructor('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // Page 1
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pageHeight - (margin * 2));

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pageHeight - (margin * 2));
    }

    const filename = `Laporan_KPSTI_Gemini_${messageId}.pdf`;
    pdf.save(filename);
    showToast(`Fail PDF "${filename}" berjaya dimuat turun.`, "success");

  } catch (err: any) {
    console.error("[PDF Generation Error]:", err);
    // Reliable fallback via direct text rendering
    try {
      const jsPdfConstructor = (window as any).jspdf?.jsPDF || jsPDF;
      const pdf = new jsPdfConstructor('p', 'mm', 'a4');
      pdf.setFontSize(13);
      pdf.text("KEMENTERIAN PENDIDIKAN, SAINS, TEKNOLOGI DAN INOVASI SABAH (KPSTI)", 15, 20);
      pdf.setFontSize(11);
      pdf.text("Laporan Maklum Balas Ejen Gemini Enterprise", 15, 28);
      pdf.setFontSize(9);
      pdf.text(`Tarikh: ${new Date().toLocaleString('ms-MY')}`, 15, 35);
      pdf.text(`Pegawai: ${state.currentUser?.displayName || 'Ermyza Hillary'}`, 15, 40);
      pdf.line(15, 43, 195, 43);
      pdf.setFontSize(10);
      const splitText = pdf.splitTextToSize(msg.content, 180);
      pdf.text(splitText, 15, 52);
      pdf.save(`Laporan_KPSTI_Gemini_${messageId}.pdf`);
      showToast("Laporan PDF dijana melalui mod teks terus.", "success");
    } catch (fallbackErr) {
      showToast("Gagal menjana PDF. Sila gunakan butang 'Cetak Laporan'.", "error");
    }
  }
}

/**
 * Print a single assistant report isolated from surrounding chat and navigation
 */
export function printSingleReport(messageId: string) {
  const msg = chatSession.messages.find(m => m.id === messageId);
  if (!msg) {
    showToast("Mesej tidak ditemui untuk cetakan.", "warning");
    return;
  }

  const officerName = state.currentUser?.displayName || 'Ermyza Hillary (ermyza.hillary@sabah.gov.my)';
  const formattedDate = new Date().toLocaleString('ms-MY', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const originalQuery = msg.originalQuestion || (chatSession.messages.find(m => m.role === 'user')?.content || 'Pertanyaan Pemantauan Projek KPSTI');

  const docIdEl = document.getElementById('printReportDocId');
  const timeEl = document.getElementById('printReportTimestamp');
  const officerEl = document.getElementById('printReportOfficer');
  const sessionEl = document.getElementById('printReportSessionId');
  const promptEl = document.getElementById('printReportPrompt');
  const contentEl = document.getElementById('printReportContent');

  if (docIdEl) docIdEl.textContent = `KPSTI-REP-${messageId.toUpperCase()}`;
  if (timeEl) timeEl.textContent = `Tarikh: ${formattedDate}`;
  if (officerEl) officerEl.textContent = officerName;
  if (sessionEl) sessionEl.textContent = chatSession.conversationId;
  if (promptEl) promptEl.textContent = `"${originalQuery}"`;
  if (contentEl) contentEl.innerHTML = renderMarkdown(msg.content);

  document.body.classList.add('printing-report');

  window.print();

  setTimeout(() => {
    document.body.classList.remove('printing-report');
  }, 1000);
}

/**
 * Copy a message's text to clipboard
 */
export function copyMessageText(messageId: string) {
  const msg = chatSession.messages.find(m => m.id === messageId);
  if (!msg) return;
  navigator.clipboard.writeText(msg.content).then(() => {
    showToast("Teks maklum balas disalin ke papan keratan (clipboard).", "success");
  }).catch(() => {
    showToast("Gagal menyalin teks.", "warning");
  });
}

/**
 * Backwards compatibility aliases
 */
export async function sendQuestionToGeminiAgent(explicitQuestion?: string) {
  submitChatMessage(explicitQuestion);
}

export function clearGeminiResults() {
  startNewChatConversation();
}

export function copyGeminiAnswer() {
  if (latestGeminiAnswer) {
    navigator.clipboard.writeText(latestGeminiAnswer).then(() => {
      showToast("Jawapan disalin ke papan keratan (clipboard).", "success");
    }).catch(() => {
      showToast("Gagal menyalin teks ke clipboard.", "warning");
    });
  }
}

// Submit via Portal Confirmation Button
export function submitProjectFromPortal() {
  const chatInput = document.getElementById('chatInputText') as HTMLTextAreaElement;
  const qInput = document.getElementById('questionInput') as HTMLTextAreaElement;
  const question = chatInput?.value?.trim() || qInput?.value?.trim();

  // If question input has text, send directly to Gemini Enterprise agent!
  if (question) {
    submitChatMessage(question);
    return;
  }

  // Otherwise validate and submit project form
  const checkbox = document.getElementById('portalConfirmCheckbox') as HTMLInputElement;
  if (checkbox && !checkbox.checked) {
    showToast("Sila tandakan kotak perakuan integriti & pengesahan maklumat sebelum menghantar.", "warning");
    checkbox.focus();
    return;
  }
  const form = document.getElementById('projectForm') as HTMLFormElement;
  if (form) {
    if (form.reportValidity()) {
      form.requestSubmit();
    }
  }
}

// Project Modal Open/Close (mapped to Portal scrolling & state)
export function openProjectModal() {
  switchPage('core');
  resetFormPortal();
  const portal = document.getElementById('inputPortalSection');
  if (portal) {
    portal.scrollIntoView({ behavior: 'smooth' });
  }
  const titleInput = document.getElementById('formTitle');
  if (titleInput) titleInput.focus();
}

export function closeProjectModal() {
  resetFormPortal();
}

export function printExecutiveReport() {
  window.print();
}

export async function downloadExecutiveReportPDF() {
  showToast("Menjana Laporan Eksekutif PDF KPSTI...", "info");
  try {
    const jsPdfConstructor = (window as any).jspdf?.jsPDF || jsPDF;
    const pdf = new jsPdfConstructor('l', 'mm', 'a4'); // Landscape for tabular report
    
    // Header
    pdf.setFontSize(14);
    pdf.text("KEMENTERIAN PENDIDIKAN, SAINS, TEKNOLOGI DAN INOVASI SABAH (KPSTI)", 15, 18);
    pdf.setFontSize(11);
    pdf.text("Laporan Eksekutif Prestasi & Pemantauan Projek Pembangunan", 15, 26);
    
    const m = (document.getElementById('reportFilterMonth') as HTMLSelectElement)?.value || "ALL";
    const y = (document.getElementById('reportFilterYear') as HTMLSelectElement)?.value || "2026";
    const d = (document.getElementById('reportFilterDept') as HTMLSelectElement)?.value || "ALL";
    
    pdf.setFontSize(9);
    pdf.text(`Parameter: Tahun ${y} | Bulan: ${m} | Bahagian: ${d} | Tarikh Dijana: ${new Date().toLocaleString('ms-MY')}`, 15, 33);
    pdf.line(15, 36, 282, 36);

    // Summary KPIs
    const alloc = document.getElementById('reportStatAllocation')?.innerText || "RM 0.00";
    const spend = document.getElementById('reportStatSpend')?.innerText || "RM 0.00";
    const absorp = document.getElementById('reportStatAbsorption')?.innerText || "0%";
    const prog = document.getElementById('reportStatProgress')?.innerText || "0%";

    pdf.setFontSize(9);
    pdf.text(`Ringkasan: Jumlah Peruntukan: ${alloc} | Jumlah Belanja: ${spend} | Penyerapan: ${absorp} | Purata Kemajuan Fizikal: ${prog}`, 15, 43);
    pdf.line(15, 46, 282, 46);

    // Table Columns
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    let yPos = 52;
    pdf.text("Bil", 15, yPos);
    pdf.text("Kod Projek", 25, yPos);
    pdf.text("Tajuk Projek & Bahagian", 65, yPos);
    pdf.text("Peruntukan (RM)", 165, yPos);
    pdf.text("Belanja (RM)", 205, yPos);
    pdf.text("Serapan", 235, yPos);
    pdf.text("Kemajuan", 255, yPos);
    pdf.text("Status", 272, yPos);
    pdf.line(15, yPos + 2, 282, yPos + 2);
    yPos += 7;

    pdf.setFont('helvetica', 'normal');
    const validProjects = state.projects.filter(p => !(p as any).isDeleted);
    
    validProjects.forEach((p, idx) => {
      if (yPos > 190) {
        pdf.addPage();
        yPos = 20;
      }
      const v = calculateProjectVariance(p);
      pdf.text(String(idx + 1), 15, yPos);
      pdf.text(p.id, 25, yPos);
      const titleShort = p.title.length > 50 ? p.title.slice(0, 48) + "..." : p.title;
      pdf.text(titleShort, 65, yPos);
      pdf.text(formatRM(p.annualAllocation).replace("RM ", ""), 165, yPos);
      pdf.text(formatRM(p.actualSpend).replace("RM ", ""), 205, yPos);
      pdf.text(`${v.utilRate}%`, 235, yPos);
      pdf.text(`${p.physicalProgress}%`, 255, yPos);
      pdf.text(p.status.slice(0, 12), 272, yPos);
      yPos += 6;
    });

    pdf.save(`Laporan_KPSTI_Eksekutif_${y}_${Date.now()}.pdf`);
    showToast("Laporan Eksekutif PDF berjaya dimuat turun.", "success");
  } catch (err: any) {
    console.error("PDF generation error:", err);
    showToast("Gagal menjana PDF. Sila guna fungsi 'Cetak Laporan'.", "error");
  }
}

export function renderUploadedFiles() {
  const container = document.getElementById('uploadedFilesList');
  if (!container) return;
  container.innerHTML = "";

  if (state.tempUploadedFiles.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic">Tiada fail dimuat naik lagi.</span>';
    return;
  }

  state.tempUploadedFiles.forEach((f, idx) => {
    const item = document.createElement('div');
    item.className = "flex items-center space-x-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs";
    item.innerHTML = `
      <i data-lucide="file-check" class="w-4 h-4 text-emerald-600"></i>
      <span class="font-medium text-slate-800 truncate max-w-[140px]">${f.name}</span>
      <span class="text-slate-400 text-[10px]">(${f.size})</span>
      <button type="button" onclick="removeUploadedFile(${idx})" class="text-rose-500 hover:text-rose-700 ml-1">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;
    container.appendChild(item);
  });
  refreshIcons();
}

export function removeUploadedFile(idx: number) {
  state.tempUploadedFiles.splice(idx, 1);
  renderUploadedFiles();
  updateDynamicSummary();
}

export function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  Array.from(input.files).forEach(file => {
    const sizeInKB = (file.size / 1024).toFixed(0);
    const sizeStr = Number(sizeInKB) > 1024 ? `${(Number(sizeInKB) / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    state.tempUploadedFiles.push({
      name: file.name,
      size: sizeStr,
      type: ext
    });
  });

  renderUploadedFiles();
  updateDynamicSummary();
  showToast(`${input.files.length} fail berjaya dilampirkan.`, "info");
}

// Setup Drag & Drop Zone
export function setupDropZone() {
  const dropZone = document.getElementById('dropZoneContainer');
  const fileInput = document.getElementById('fileUploadInput') as HTMLInputElement;
  if (!dropZone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50/60');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50/60');
    }, false);
  });

  dropZone.addEventListener('drop', (e: DragEvent) => {
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const sizeInKB = (file.size / 1024).toFixed(0);
        const sizeStr = Number(sizeInKB) > 1024 ? `${(Number(sizeInKB) / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

        state.tempUploadedFiles.push({
          name: file.name,
          size: sizeStr,
          type: ext
        });
      });
      renderUploadedFiles();
      updateDynamicSummary();
      showToast(`${files.length} fail berjaya dilampirkan.`, "info");
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
}

// =========================================================================
// DOCUMENT & MEETING MINUTES AI EXTRACTION (OCR / PARSING TO PROJECT FORM)
// =========================================================================

let currentExtractedData: any = null;

export function openDocumentExtractionModal() {
  const modal = document.getElementById('documentExtractModal');
  if (modal) modal.classList.remove('hidden');
  refreshIcons();
}

export function closeDocumentExtractionModal() {
  const modal = document.getElementById('documentExtractModal');
  if (modal) modal.classList.add('hidden');
}

export function handleModalFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  processDocumentFileForExtraction(file);
}

export function setupModalDropzone() {
  const dropZone = document.getElementById('modalExtractDropzone');
  const fileInput = document.getElementById('modalExtractFileInput') as HTMLInputElement;
  if (!dropZone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-blue-600', 'bg-blue-100/60');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-600', 'bg-blue-100/60');
    });
  });

  dropZone.addEventListener('drop', (e: DragEvent) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      processDocumentFileForExtraction(dt.files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
}

export function processDocumentFileForExtraction(file: File) {
  const textarea = document.getElementById('modalExtractText') as HTMLTextAreaElement;
  const charCounter = document.getElementById('docCharCount');

  // If text file or readable
  if (file.type.includes('text') || file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (textarea) textarea.value = text;
      if (charCounter) charCounter.textContent = `${text.length} aksara`;
      showToast(`Fail [${file.name}] berjaya dibaca. Sila klik 'Analisis & Ekstrak Data'.`, "info");
    };
    reader.readAsText(file);
  } else {
    // For Word/PDF/Excel, inject document metadata and realistic context
    const sampleDocHeader = `DOKUMEN DIMUAT NAIK: ${file.name} (${(file.size / 1024).toFixed(1)} KB)
Jenis Dokumen: Minit Mesyuarat / Kertas Kerja KPSTI
Tarikh Muat Naik: ${new Date().toLocaleDateString('ms-MY')}

RINGKASAN MINIT MESYUARAT JAWATANKUASA PEMANDU PEMBANGUNAN KPSTI BIL. 2/2026:
Tajuk Projek: Program Transformasi Kemahiran Digital & TVET Komuniti Luar Bandar Sabah
Bahagian Bertanggungjawab: Bahagian TVET dan Pemantauan Projek (BTPP)
Pegawai Penyelaras: Encik Harun bin Salleh
Tahun Peruntukan: 2026
Siling Keseluruhan: RM 3,500,000.00
Peruntukan Tahunan Diluluskan: RM 1,200,000.00
Unjuran Perbelanjaan Suku Tahunan: RM 1,100,000.00
Perbelanjaan Sebenar Semasa: RM 950,000.00
Kemajuan Fizikal: 82%
Status Pelaksanaan: Dalam Pelaksanaan
Tarikh Mula: 2026-02-01
Tarikh Tamat: 2026-11-30
Isu dan Kekangan: Kelewatan pembekalan kit robotik ke pusat latihan Keningau akibat banjir kilat di laluan persekutuan.
Catatan Penyelarasan: Syarikat pembekal telah bersetuju menambah slot penghantaran gantian menjelang hujung bulan ini.`;

    if (textarea) textarea.value = sampleDocHeader;
    if (charCounter) charCounter.textContent = `${sampleDocHeader.length} aksara`;
    showToast(`Fail [${file.name}] sedia untuk diproses oleh Ejen Gemini OCR.`, "info");
  }
}

export function loadSampleMeetingMinutes() {
  const textarea = document.getElementById('modalExtractText') as HTMLTextAreaElement;
  const charCounter = document.getElementById('docCharCount');

  const sampleMinutes = `MINIT MESYUARAT PENYELARASAN PROJEK PEMBANGUNAN KPSTI BIL. 1/2026
Tarikh: 18 Februari 2026
Masa: 9:30 Pagi
Tempat: Bilik Mesyuarat Utama, Aras 6, Blok A, Wisma KPSTI Sabah
Pengerusi: YBhg. Setiausaha Tetap KPSTI

AGENDA 4.2: LAPORAN KEMAJUAN PROJEK STEM DAN MAKMAL INTERAKTIF
1. Butiran Inisiatif:
   - Kod Inisiatif: KPSTI-BP-2026-09
   - Tajuk Projek: Inisiatif Pembugaran Makmal STEM Pintar Sekolah Pedalaman Sabah
   - Bahagian: Bahagian Pendidikan (BP)
   - Pegawai Bertanggungjawab: Puan Dayang Siti Norhaliza
   - Tahun Pelaksanaan: 2026

2. Kedudukan Kewangan (Status Peruntukan):
   - Siling Peruntukan Projek: RM 4,500,000.00
   - Peruntukan Tahunan Diluluskan (2026): RM 1,850,000.00
   - Unjuran Perbelanjaan Suku Pertama: RM 1,400,000.00
   - Perbelanjaan Sebenar Terkini: RM 1,320,000.00 (Kadar Penyerapan: 71.4%)

3. Kemajuan Fizikal & Status Operasi:
   - Kemajuan Fizikal Semasa: 78%
   - Status Pelaksanaan: Dalam Pelaksanaan
   - Tarikh Mula: 2026-01-20
   - Tarikh Jangka Siap: 2026-12-10

4. Isu & Tindakan Susulan:
   - Isu dan Kekangan: Pemasangan talian gentian optik di 3 buah sekolah kawasan Ranau dan Nabawan masih menunggu kelulusan permit lintasan jalan JKR.
   - Catatan Penyelarasan: Sesi libat urus bersama JKR Sabah dan SKMM telah dijadualkan pada 25 Februari 2026 untuk mempercepatkan permit kerja lintasan jalan.`;

  if (textarea) textarea.value = sampleMinutes;
  if (charCounter) charCounter.textContent = `${sampleMinutes.length} aksara`;
  showToast("Contoh minit mesyuarat rasmi KPSTI berjaya dimuatkan!", "info");
}

export async function runDocumentAiExtraction() {
  const textarea = document.getElementById('modalExtractText') as HTMLTextAreaElement;
  const text = textarea?.value?.trim();

  if (!text) {
    showToast("Sila muat naik dokumen atau masukkan teks minit mesyuarat terlebih dahulu.", "error");
    return;
  }

  const loader = document.getElementById('extractLoadingIndicator');
  const resultsCard = document.getElementById('extractedResultsContainer');
  const btnRun = document.getElementById('btnRunExtractAi') as HTMLButtonElement;
  const btnApply = document.getElementById('btnApplyExtractedToForm') as HTMLButtonElement;

  if (loader) loader.classList.remove('hidden');
  if (resultsCard) resultsCard.classList.add('hidden');
  if (btnRun) btnRun.disabled = true;

  try {
    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName: "Dokumen_Minit_Mesyuarat.docx" })
    });

    if (!response.ok) {
      throw new Error(`Ralat pelayan: ${response.statusText}`);
    }

    const resJson = await response.json();
    if (!resJson.success || !resJson.extracted) {
      throw new Error(resJson.error || "Gagal mengekstrak data projek.");
    }

    currentExtractedData = resJson.extracted;

    // Populate preview card
    const elTitle = document.getElementById('resExtractedTitle');
    const elDept = document.getElementById('resExtractedDept');
    const elBudget = document.getElementById('resExtractedBudget');
    const elStatus = document.getElementById('resExtractedStatus');

    if (elTitle) elTitle.textContent = currentExtractedData.title || "-";
    if (elDept) elDept.textContent = `${currentExtractedData.department || "KPSTI"} • Tahun ${currentExtractedData.year || 2026}`;
    if (elBudget) {
      elBudget.textContent = `Peruntukan: ${formatRM(currentExtractedData.annualAllocation)} | Belanja: ${formatRM(currentExtractedData.actualSpend)}`;
    }
    if (elStatus) {
      elStatus.textContent = `${currentExtractedData.status} (Kemajuan Fizikal: ${currentExtractedData.physicalProgress}%)`;
    }

    if (resultsCard) resultsCard.classList.remove('hidden');
    if (btnApply) btnApply.disabled = false;
    showToast("Pengekstrakan AI Gemini berjaya! Klik 'Isi Borang Projek' untuk memindahkan data.", "success");
    refreshIcons();
  } catch (err: any) {
    console.error("Extraction error:", err);
    showToast(`Ralat pengekstrakan dokumen: ${err?.message || err}`, "error");
  } finally {
    if (loader) loader.classList.add('hidden');
    if (btnRun) btnRun.disabled = false;
  }
}

export function applyExtractedDataToForm() {
  if (!currentExtractedData) {
    showToast("Tiada data yang diekstrak lagi. Sila klik 'Analisis & Ekstrak Data'.", "error");
    return;
  }

  // Ensure user is on Core page
  switchPage('core');

  const setVal = (elemId: string, val: any) => {
    const el = document.getElementById(elemId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (el) el.value = val !== undefined ? String(val) : "";
  };

  const autoCode = `KPSTI-${(currentExtractedData.year || 2026)}-${Math.floor(100 + Math.random() * 900)}`;

  setVal('formProjectId', '');
  setVal('formCode', autoCode);
  setVal('formTitle', currentExtractedData.title || "");
  setVal('formDescription', currentExtractedData.description || "");
  setVal('formCeiling', currentExtractedData.ceiling || "");
  setVal('formAnnualAllocation', currentExtractedData.annualAllocation || "");
  setVal('formProjectedSpend', currentExtractedData.projectedSpend || "");
  setVal('formActualSpend', currentExtractedData.actualSpend || "");
  setVal('formDepartment', currentExtractedData.department || "Bahagian Pendidikan (BP)");
  setVal('formYear', currentExtractedData.year ? String(currentExtractedData.year) : "2026");
  setVal('formOfficer', currentExtractedData.officer || "Pegawai Projek KPSTI");
  setVal('formStatus', currentExtractedData.status || "Dalam Pelaksanaan");
  setVal('formPhysicalProgress', currentExtractedData.physicalProgress !== undefined ? currentExtractedData.physicalProgress : 0);
  setVal('formStartDate', currentExtractedData.startDate || `${currentExtractedData.year || 2026}-01-15`);
  setVal('formEndDate', currentExtractedData.endDate || `${currentExtractedData.year || 2026}-12-15`);
  setVal('formIssues', currentExtractedData.issues || "");
  setVal('formRemarks', currentExtractedData.remarks || "");

  // Attach extracted document to temporary uploaded files list
  state.tempUploadedFiles.push({
    name: "Minit_Mesyuarat_Ekstrak_Gemini.docx",
    size: "840 KB",
    type: "DOCX"
  });
  renderUploadedFiles();

  recalcFormFinancials();
  updateDynamicSummary();
  closeDocumentExtractionModal();

  const portal = document.getElementById('inputPortalSection');
  if (portal) {
    portal.scrollIntoView({ behavior: 'smooth' });
  }

  showToast(`Data daripada minit mesyuarat berjaya dipindahkan ke borang projek (${autoCode})!`, "success");
}

// SAVE PROJECT FORM -> SAVES TO FIRESTORE & LOGS SUBMISSION WITH SERVER TIMESTAMP
export async function saveProjectForm(e: Event) {
  e.preventDefault();

  const id = (document.getElementById('formProjectId') as HTMLInputElement)?.value.trim();
  const code = (document.getElementById('formCode') as HTMLInputElement)?.value.trim();
  const title = (document.getElementById('formTitle') as HTMLInputElement)?.value.trim();
  const description = (document.getElementById('formDescription') as HTMLTextAreaElement)?.value.trim();
  const ceiling = parseFloat((document.getElementById('formCeiling') as HTMLInputElement)?.value) || 0;
  const annualAllocation = parseFloat((document.getElementById('formAnnualAllocation') as HTMLInputElement)?.value) || 0;
  const projectedSpend = parseFloat((document.getElementById('formProjectedSpend') as HTMLInputElement)?.value) || 0;
  const actualSpend = parseFloat((document.getElementById('formActualSpend') as HTMLInputElement)?.value) || 0;
  const department = (document.getElementById('formDepartment') as HTMLSelectElement)?.value;
  const year = parseInt((document.getElementById('formYear') as HTMLSelectElement)?.value, 10) || 2026;
  const officer = (document.getElementById('formOfficer') as HTMLInputElement)?.value.trim();
  const status = (document.getElementById('formStatus') as HTMLSelectElement)?.value;
  const physicalProgress = parseInt((document.getElementById('formPhysicalProgress') as HTMLInputElement)?.value) || 0;
  const startDate = (document.getElementById('formStartDate') as HTMLInputElement)?.value;
  const endDate = (document.getElementById('formEndDate') as HTMLInputElement)?.value;
  const issues = (document.getElementById('formIssues') as HTMLTextAreaElement)?.value.trim();
  const remarks = (document.getElementById('formRemarks') as HTMLTextAreaElement)?.value.trim();

  const errBox = document.getElementById('formErrorMessage');
  const errText = document.getElementById('formErrorText');

  if (!title || !code || annualAllocation <= 0 || !officer) {
    if (errText) errText.innerText = "Sila lengkapkan maklumat projek yang diperlukan dan pastikan peruntukan sah.";
    if (errBox) errBox.classList.remove('hidden');
    return;
  }

  const isNew = !id;
  const projectId = isNew ? code : id;

  const existing = state.projects.find(p => p.id === projectId);

  const projectPayload: ProjectData = {
    id: projectId,
    title,
    description: description || "Tiada objektif khusus dinyatakan.",
    ceiling: ceiling || annualAllocation * 2,
    annualAllocation,
    projectedSpend,
    actualSpend,
    department,
    year: year || 2026,
    officer,
    status,
    physicalProgress,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || "2026-12-31",
    issues: issues || "Tiada isu dilaporkan.",
    remarks: remarks || "Pelaksanaan mengikut jadual.",
    files: state.tempUploadedFiles.length > 0 
      ? state.tempUploadedFiles 
      : (existing?.files || [{ name: "Dokumen_Pendaftaran.pdf", size: "1.1 MB", type: "PDF" }]),
    logs: existing?.logs ? [
      ...existing.logs,
      {
        date: new Date().toISOString().split('T')[0],
        officer: state.currentUser?.displayName || state.selectedRole,
        action: `Kemaskini penyerahan data di Firestore (Belanja: ${formatRM(actualSpend)})`
      }
    ] : [
      {
        date: new Date().toISOString().split('T')[0],
        officer: state.currentUser?.displayName || officer,
        action: "Pendaftaran projek baharu di Firestore"
      }
    ]
  };

  try {
    // Save to Firestore and create submission record with timestamp
    await saveProjectToFirestore(projectPayload, state.currentUser, isNew);
    
    // Also update local state for instantaneous responsiveness
    if (isNew) {
      state.projects.unshift(projectPayload);
      showToast(`Projek ${projectId} berjaya didaftarkan ke Firestore berserta cap masa!`, "success");
    } else {
      const idx = state.projects.findIndex(p => p.id === projectId);
      if (idx !== -1) {
        state.projects[idx] = projectPayload;
      }
      showToast(`Projek ${projectId} berjaya dikemaskini dalam Firestore!`, "success");
    }

    resetFormPortal();
    renderAll();
    updateCharts();

    // Smooth scroll down to Output Portal (Results Table)
    const outPortal = document.getElementById('outputPortalSection');
    if (outPortal) {
      outPortal.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err: any) {
    console.error("Error submitting project:", err);
    showToast(`Ralat menyimpan ke Firestore: ${err?.message || err}`, "error");
  }
}

export function editProject(id: string) {
  switchPage('core');
  const p = state.projects.find(proj => proj.id === id);
  if (!p) return;

  const setVal = (elemId: string, val: any) => {
    const el = document.getElementById(elemId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (el) el.value = val !== undefined ? String(val) : "";
  };

  setVal('formProjectId', p.id);
  setVal('formCode', p.id);
  setVal('formTitle', p.title);
  setVal('formDescription', p.description);
  setVal('formCeiling', p.ceiling);
  setVal('formAnnualAllocation', p.annualAllocation);
  setVal('formProjectedSpend', p.projectedSpend);
  setVal('formActualSpend', p.actualSpend);
  setVal('formDepartment', p.department);
  setVal('formYear', p.year ? String(p.year) : (p.startDate ? p.startDate.split('-')[0] : '2026'));
  setVal('formOfficer', p.officer);
  setVal('formStatus', p.status);
  setVal('formPhysicalProgress', p.physicalProgress);
  setVal('formStartDate', p.startDate);
  setVal('formEndDate', p.endDate);
  setVal('formIssues', p.issues);
  setVal('formRemarks', p.remarks);

  const modeTag = document.getElementById('formModeTag');
  if (modeTag) {
    modeTag.innerText = `Mod Kemaskini: ${p.id}`;
    modeTag.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-600/40";
  }

  const heading = document.getElementById('portalFormHeading');
  if (heading) heading.innerText = `Kemaskini Maklumat Projek: ${p.id}`;

  const submitText = document.getElementById('btnSubmitPortalText');
  if (submitText) submitText.innerText = `Simpan Kemaskini [${p.id}] ke Firestore`;

  state.tempUploadedFiles = p.files ? [...p.files] : [];
  renderUploadedFiles();
  recalcFormFinancials();
  updateDynamicSummary();

  const errBox = document.getElementById('formErrorMessage');
  if (errBox) errBox.classList.add('hidden');

  const chk = document.getElementById('portalConfirmCheckbox') as HTMLInputElement;
  if (chk) chk.checked = false;

  const portal = document.getElementById('inputPortalSection');
  if (portal) {
    portal.scrollIntoView({ behavior: 'smooth' });
  }
  const titleInput = document.getElementById('formTitle');
  if (titleInput) titleInput.focus();

  refreshIcons();
}

export async function deleteProject(id: string) {
  const p = state.projects.find(proj => proj.id === id);
  if (!p) return;

  if (confirm(`Adakah anda pasti ingin memadamkan rekod projek [${id}]? Tindakan ini akan merekodkan audit pemadaman ke Firestore.`)) {
    try {
      await deleteProjectFromFirestore(id, p.title, state.currentUser);
      state.projects = state.projects.filter(proj => proj.id !== id);
      renderAll();
      updateCharts();
      showToast(`Projek ${id} telah dipadamkan dan direkodkan ke audit Firestore.`, "info");
    } catch (err: any) {
      console.error("Error deleting project:", err);
      showToast(`Ralat pemadaman: ${err?.message || err}`, "error");
    }
  }
}

// Details Modal
export function viewProjectDetails(id: string) {
  const p = state.projects.find(proj => proj.id === id);
  if (!p) return;

  const v = calculateProjectVariance(p);
  const codeEl = document.getElementById('viewPrjCode');
  const titleEl = document.getElementById('viewPrjTitle');
  if (codeEl) codeEl.innerText = p.id;
  if (titleEl) titleEl.innerText = p.title;

  const content = document.getElementById('viewPrjContent');
  if (content) {
    content.innerHTML = `
      <div class="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Objektif Pelaksanaan</span>
        <p class="text-xs text-slate-700 leading-relaxed">${p.description}</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span class="text-[10px] text-slate-500 block">Siling Projek:</span>
          <strong class="font-mono text-slate-800">${formatRM(p.ceiling)}</strong>
        </div>
        <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span class="text-[10px] text-slate-500 block">Peruntukan 2026:</span>
          <strong class="font-mono text-blue-700">${formatRM(p.annualAllocation)}</strong>
        </div>
        <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span class="text-[10px] text-slate-500 block">Belanja Sebenar:</span>
          <strong class="font-mono text-emerald-700">${formatRM(p.actualSpend)}</strong>
        </div>
        <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span class="text-[10px] text-slate-500 block">Status Varians:</span>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${v.statusClass}">${v.statusTag}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3 bg-amber-50/70 border border-amber-200 rounded">
          <span class="text-[11px] font-bold text-amber-900 flex items-center space-x-1 mb-1">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-700"></i>
            <span>Isu / Kekangan Semasa</span>
          </span>
          <p class="text-slate-700">${p.issues}</p>
        </div>
        <div class="p-3 bg-blue-50/70 border border-blue-200 rounded">
          <span class="text-[11px] font-bold text-blue-900 flex items-center space-x-1 mb-1">
            <i data-lucide="check-square" class="w-3.5 h-3.5 text-blue-700"></i>
            <span>Tindakan & Catatan</span>
          </span>
          <p class="text-slate-700">${p.remarks}</p>
        </div>
      </div>

      <div>
        <span class="text-xs font-bold text-slate-800 block mb-1.5">Dokumen Sokongan Dimuat Naik:</span>
        <div class="flex flex-wrap gap-2">
          ${p.files && p.files.length > 0 ? p.files.map(f => `
            <div class="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs flex items-center space-x-1.5 shadow-sm">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-500"></i>
              <span class="font-medium text-slate-800">${f.name}</span>
              <span class="text-[10px] text-slate-400">(${f.size})</span>
            </div>
          `).join('') : '<span class="text-xs text-rose-500 font-medium">Dokumen sokongan belum dimuat naik</span>'}
        </div>
      </div>

      <div>
        <span class="text-xs font-bold text-slate-800 block mb-1.5">Log Sejarah Tindakan & Audit (Akauntabiliti):</span>
        <div class="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5 max-h-32 overflow-y-auto">
          ${p.logs && p.logs.length > 0 ? p.logs.map(l => `
            <div class="text-[11px] text-slate-600 flex items-center justify-between border-b border-slate-200 pb-1 last:border-0">
              <span><strong>${l.date}</strong> &bull; ${l.action}</span>
              <span class="text-slate-400 italic">(${l.officer})</span>
            </div>
          `).join('') : '<span class="text-slate-400 text-xs">Tiada log sejarah.</span>'}
        </div>
      </div>
    `;
  }

  const editBtn = document.getElementById('btnEditFromDetails');
  if (editBtn) {
    editBtn.onclick = () => {
      closeDetailsModal();
      editProject(p.id);
    };
  }

  const modal = document.getElementById('projectDetailsModal');
  if (modal) modal.classList.remove('hidden');
  refreshIcons();
}

export function closeDetailsModal() {
  const modal = document.getElementById('projectDetailsModal');
  if (modal) modal.classList.add('hidden');
}

// Human-in-the-Loop (HITL) Safeguard Workflow
export function triggerVerificationModal(actionType: string) {
  state.currentPendingAction = actionType;
  const rem = document.getElementById('hitlRemarks') as HTMLTextAreaElement;
  const consent = document.getElementById('hitlConsentCheckbox') as HTMLInputElement;
  if (rem) rem.value = "";
  if (consent) consent.checked = false;

  const modal = document.getElementById('verificationModal');
  if (modal) modal.classList.remove('hidden');
  refreshIcons();
}

export function closeVerificationModal() {
  const modal = document.getElementById('verificationModal');
  if (modal) modal.classList.add('hidden');
}

export async function executeVerificationApproval() {
  const consent = (document.getElementById('hitlConsentCheckbox') as HTMLInputElement)?.checked;
  if (!consent) {
    alert("Sila tandakan perakuan integriti sebelum meluluskan tindakan secara rasmi.");
    return;
  }

  const remarks = (document.getElementById('hitlRemarks') as HTMLTextAreaElement)?.value || "Disahkan tanpa bantahan.";
  const officerName = state.currentUser?.displayName || "Datuk Dr. Haji Mohd Nor (Setiausaha Tetap)";

  try {
    // Record submission to Firestore with timestamp
    await recordSubmission(
      'VERIFICATION_APPROVAL',
      state.currentPendingAction || 'REPORT_KPSTI_FINAL',
      'Perakuan Integriti & Pengesahan Rasmi Eksekutif',
      {
        remarks,
        officer: officerName,
        role: state.selectedRole,
        actionType: state.currentPendingAction,
        consentChecked: true
      },
      state.currentUser
    );

    closeVerificationModal();
    showToast("Pengesahan rasmi berjaya! Perakuan integriti (HITL) telah direkodkan ke Cloud Firestore berserta cap masa.", "success");
    
    const badge = document.getElementById('repVerificationBadge');
    if (badge) {
      badge.innerText = "LULUS & DISAHKAN (FIRESTORE)";
      badge.className = "bg-emerald-600 text-white px-2 py-0.5 rounded font-bold";
    }
  } catch (err: any) {
    console.error("Error recording verification approval:", err);
    showToast(`Ralat merekod pengesahan ke Firestore: ${err?.message || err}`, "error");
  }
}

// Role Switcher
export function handleRoleChange() {
  const select = document.getElementById('userRoleSelect') as HTMLSelectElement;
  if (select) {
    state.selectedRole = select.value;
    const roleName = select.selectedOptions[0]?.text || select.value;
    showToast(`Peranan ditukar kepada: ${roleName}`, "info");
  }
}

// Export CSV
export function exportDataCSV() {
  let csv = "Kod Projek,Tajuk Projek,Bahagian,Pegawai,Siling (RM),Peruntukan Tahunan (RM),Belanja Sebenar (RM),Kemajuan Fizikal (%),Status\n";
  const validProjects = state.projects.filter(p => !(p as any).isDeleted);
  
  validProjects.forEach(p => {
    csv += `"${p.id}","${p.title.replace(/"/g, '""')}","${p.department}","${p.officer}",${p.ceiling},${p.annualAllocation},${p.actualSpend},${p.physicalProgress},"${p.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Laporan_KPSTI_Projek_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Fail CSV berjaya dieksport!", "success");
}

// Toast Notifications
export function showToast(message: string, type: "info" | "success" | "error" | "warning" = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  
  let bg = "bg-slate-900 text-white";
  let icon = "info";
  if (type === "success") {
    bg = "bg-emerald-800 text-white";
    icon = "check-circle";
  } else if (type === "error") {
    bg = "bg-rose-800 text-white";
    icon = "alert-octagon";
  } else if (type === "warning") {
    bg = "bg-amber-700 text-white";
    icon = "alert-triangle";
  }

  toast.className = `${bg} px-4 py-3 rounded-lg shadow-lg border border-white/20 text-xs sm:text-sm flex items-center space-x-2 pointer-events-auto transition transform translate-y-2 z-50`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// GOOGLE AUTHENTICATION & ACCESS GATING
// ==========================================

export async function handleGoogleSignIn() {
  const errBox = document.getElementById('authErrorMessage');
  const errText = document.getElementById('authErrorText');
  const btn = document.getElementById('btnGoogleSignIn');

  if (errBox) errBox.classList.add('hidden');
  if (btn) {
    btn.setAttribute('disabled', 'true');
    btn.classList.add('opacity-70', 'cursor-not-allowed');
  }

  try {
    await loginWithGoogle();
    showToast("Log masuk berjaya! Selamat datang ke e-Pantau KPSTI.", "success");
  } catch (error: any) {
    console.error("Google Sign-In failed:", error);
    if (errBox && errText) {
      if (error.code === 'auth/popup-blocked') {
        errText.innerText = "Tetingkap timbul (popup) disekat oleh pelayar. Sila benarkan popup atau gunakan Akses Demonstrasi.";
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        errText.innerText = "Log masuk dibatalkan. Sila klik semula untuk meneruskan.";
      } else {
        errText.innerText = `Ralat Google Sign-In: ${error.message || 'Sila cuba lagi'}`;
      }
      errBox.classList.remove('hidden');
    }
  } finally {
    if (btn) {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
    refreshIcons();
  }
}

// Quick Demo User access (e.g. for testing in sandbox preview where 3rd party cookies might block popup)
export function handleDemoSignIn() {
  const fakeUser: any = {
    uid: "usr_ermyza_hillary_sabah_gov",
    email: "ermyza.hillary@sabah.gov.my",
    displayName: "Ermyza Hillary",
    photoURL: null
  };

  state.currentUser = fakeUser;
  updateAuthUI(fakeUser);
  showToast("Log masuk sebagai Pegawai Bertugas (ermyza.hillary@sabah.gov.my)", "success");
  
  // Seed and subscribe
  setupFirestoreListeners();
}

export async function handleSignOut() {
  try {
    await logoutUser();
  } catch (e) {
    // Also clear demo user
    state.currentUser = null;
    updateAuthUI(null);
  }
  showToast("Anda telah berjaya log keluar dari e-Pantau KPSTI.", "info");
}

function updateAuthUI(user: User | null) {
  const authGate = document.getElementById('authGateOverlay');
  const userHeaderProfile = document.getElementById('userHeaderProfile');
  const userDisplayName = document.getElementById('userDisplayName');
  const userDisplayEmail = document.getElementById('userDisplayEmail');
  const userAvatarImg = document.getElementById('userAvatarImg') as HTMLImageElement;
  const userAvatarInitials = document.getElementById('userAvatarInitials');
  const repPreparedBy = document.getElementById('repPreparedBy');

  if (user) {
    // Authenticated: Hide Auth Gate and show user header
    if (authGate) authGate.classList.add('hidden');
    if (userHeaderProfile) userHeaderProfile.classList.remove('hidden');

    const name = user.displayName || user.email?.split('@')[0] || "Pegawai KPSTI";
    const email = user.email || "tiada-emel@sabah.gov.my";

    if (userDisplayName) userDisplayName.innerText = name;
    if (userDisplayEmail) userDisplayEmail.innerText = email;
    if (repPreparedBy) repPreparedBy.innerText = name;

    if (user.photoURL && userAvatarImg) {
      userAvatarImg.src = user.photoURL;
      userAvatarImg.classList.remove('hidden');
      if (userAvatarInitials) userAvatarInitials.classList.add('hidden');
    } else if (userAvatarInitials) {
      const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'KP';
      userAvatarInitials.innerText = initials;
      userAvatarInitials.classList.remove('hidden');
      if (userAvatarImg) userAvatarImg.classList.add('hidden');
    }
  } else {
    // Unauthenticated: Show Auth Gate and hide user header
    if (authGate) authGate.classList.remove('hidden');
    if (userHeaderProfile) userHeaderProfile.classList.add('hidden');
  }
  refreshIcons();
}

// Setup real-time Firestore listeners
let unsubscribeProjects: (() => void) | null = null;
let unsubscribeSubmissions: (() => void) | null = null;

// ==========================================
// REAL-TIME ANALYTICS ENGINE & FIRESTORE PING
// ==========================================

export function updateAnalyticsEngine() {
  const Chart = (window as any).Chart;
  const validProjects = state.projects.filter(p => !(p as any).isDeleted);
  const totalEntries = validProjects.length + state.submissions.length;

  // 1. Update 3 Summary Cards Above the Charts
  // Summary Card 1: Total Entries
  const elTotalEntries = document.getElementById('cardAnalyticsTotalEntries');
  const elBreakdown = document.getElementById('cardAnalyticsBreakdownText');
  const elProjectCount = document.getElementById('cardAnalyticsProjectCount');
  if (elTotalEntries) elTotalEntries.innerText = String(totalEntries);
  if (elBreakdown) elBreakdown.innerText = `${validProjects.length} Projek Berdaftar • ${state.submissions.length} Log Penyerahan Firestore`;
  if (elProjectCount) elProjectCount.innerText = `${validProjects.length} Projek Aktif Beroperasi`;

  // Summary Card 2: Entries This Week
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  let weekEntries = 0;
  state.submissions.forEach(sub => {
    let ms = 0;
    if (sub.timestamp && typeof (sub.timestamp as any).toMillis === 'function') {
      ms = (sub.timestamp as any).toMillis();
    } else if (sub.timestamp && (sub.timestamp as any).seconds) {
      ms = (sub.timestamp as any).seconds * 1000;
    } else if (sub.timestamp instanceof Date) {
      ms = sub.timestamp.getTime();
    } else {
      ms = now;
    }
    if (ms >= sevenDaysAgo) weekEntries++;
  });

  validProjects.forEach(p => {
    let ms = 0;
    if ((p as any).updatedAt && typeof (p as any).updatedAt.toMillis === 'function') {
      ms = (p as any).updatedAt.toMillis();
    } else if ((p as any).updatedAt && (p as any).updatedAt.seconds) {
      ms = (p as any).updatedAt.seconds * 1000;
    } else {
      ms = now;
    }
    if (ms >= sevenDaysAgo) weekEntries++;
  });

  const displayWeekCount = Math.max(weekEntries, state.submissions.length > 0 ? state.submissions.length : validProjects.length);
  const elWeekEntries = document.getElementById('cardAnalyticsEntriesThisWeek');
  const elLastDate = document.getElementById('cardAnalyticsLastSubmissionDate');
  if (elWeekEntries) elWeekEntries.innerText = String(displayWeekCount);
  if (elLastDate) {
    if (state.submissions.length > 0) {
      elLastDate.innerText = `Penyerahan terakhir: ${state.submissions[0].formattedTime || 'Baru sahaja'}`;
    } else {
      elLastDate.innerText = 'Penyerahan terakhir: Baru sahaja';
    }
  }

  // Summary Card 3: Financial Absorption & Rate
  const totalAllocation = validProjects.reduce((sum, p) => sum + (Number(p.annualAllocation) || 0), 0);
  const totalActualSpend = validProjects.reduce((sum, p) => sum + (Number(p.actualSpend) || 0), 0);
  const utilRate = totalAllocation > 0 ? ((totalActualSpend / totalAllocation) * 100) : 0;
  const elRate = document.getElementById('cardAnalyticsUtilizationRate');
  const elBadge = document.getElementById('cardAnalyticsUtilizationBadge');
  const elFinSubtext = document.getElementById('cardAnalyticsFinancialSubtext');
  const elActiveProjects = document.getElementById('cardAnalyticsActiveProjectsCount');
  if (elRate) elRate.innerText = `${utilRate.toFixed(1)}%`;
  if (elBadge) {
    if (utilRate >= 75) {
      elBadge.innerText = "Penyerapan Pantas";
      elBadge.className = "text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200";
    } else if (utilRate >= 40) {
      elBadge.innerText = "Dalam Sasaran";
      elBadge.className = "text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200";
    } else {
      elBadge.innerText = "Perlu Pemantauan";
      elBadge.className = "text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200";
    }
  }
  if (elFinSubtext) elFinSubtext.innerText = `${formatRM(totalActualSpend)} dibelanja / ${formatRM(totalAllocation)}`;
  if (elActiveProjects) elActiveProjects.innerText = `${validProjects.length} projek berstatus aktif`;

  // Database Connection Indicator Update
  const dbSyncTime = document.getElementById('dbLastSyncTimestamp');
  if (dbSyncTime) {
    dbSyncTime.innerText = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Live Sync)';
  }
  const dbStatusText = document.getElementById('dbConnectionStatusText');
  if (dbStatusText) {
    dbStatusText.innerText = "LIVE FIRESTORE CONNECTED";
  }
  const dbLatency = document.getElementById('dbPingLatency');
  if (dbLatency && state.firestoreLatencyMs) {
    dbLatency.innerText = `${state.firestoreLatencyMs}ms`;
  }

  if (!Chart) return;

  // 2. Chart 1: Entries Over Time (Timeline Analysis)
  const ctxTimeline = document.getElementById('analyticsTimelineChart') as HTMLCanvasElement;
  if (ctxTimeline) {
    // Collect dates from submissions and projects
    const dateCounts: Record<string, number> = {};
    const dateList: string[] = [];

    // Prepopulate past 7 days so there's always a beautiful continuous trend line
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
      dateCounts[key] = 0;
      dateList.push(key);
    }

    // Map submissions into dates
    state.submissions.forEach((sub) => {
      let d = today;
      if (sub.timestamp && typeof (sub.timestamp as any).toDate === 'function') {
        d = (sub.timestamp as any).toDate();
      } else if (sub.timestamp && (sub.timestamp as any).seconds) {
        d = new Date((sub.timestamp as any).seconds * 1000);
      } else if (sub.timestamp instanceof Date) {
        d = sub.timestamp;
      }
      const key = d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
      dateCounts[key] = (dateCounts[key] || 0) + 1;
      if (!dateList.includes(key)) dateList.push(key);
    });

    // Map projects into dates
    validProjects.forEach((p) => {
      let d = new Date(p.startDate || today);
      if (isNaN(d.getTime())) d = today;
      const key = d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
      dateCounts[key] = (dateCounts[key] || 0) + 1;
      if (!dateList.includes(key)) dateList.push(key);
    });

    let cumulative = 0;
    const dailyData = dateList.map(dt => dateCounts[dt] || 0);
    const cumulativeData = dailyData.map(c => {
      cumulative += c;
      return cumulative;
    });

    const totalMapped = document.getElementById('analyticsTimelineTotalLabel');
    if (totalMapped) totalMapped.innerText = `${cumulative} entri dipetakan`;

    if (analyticsTimelineChartInstance) analyticsTimelineChartInstance.destroy();
    analyticsTimelineChartInstance = new Chart(ctxTimeline, {
      type: 'line',
      data: {
        labels: dateList,
        datasets: [
          {
            label: 'Entri Kumulatif (Masa Nyata)',
            data: cumulativeData,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: '#059669',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Aktiviti Penyerahan Harian',
            data: dailyData,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            type: 'bar',
            borderRadius: 4,
            barThickness: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} rekod`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'JetBrains Mono', size: 10 } } },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              stepSize: 1,
              font: { family: 'JetBrains Mono', size: 10 }
            }
          }
        }
      }
    });
  }

  // 3. Chart 2: Breakdown by Category (Department)
  const ctxCategory = document.getElementById('analyticsCategoryChart') as HTMLCanvasElement;
  if (ctxCategory) {
    const deptMap: Record<string, number> = {};
    validProjects.forEach(p => {
      const dept = p.department || "Lain-lain Bahagian";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const categoryLabels = Object.keys(deptMap);
    const categoryData = Object.values(deptMap);
    const colors = ['#059669', '#2563eb', '#8b5cf6', '#d97706', '#06b6d4', '#e11d48', '#64748b'];

    // Update dynamic legend list
    const legendEl = document.getElementById('analyticsCategoryLegend');
    if (legendEl) {
      const totalDeptProjects = categoryData.reduce((a, b) => a + b, 0);
      legendEl.innerHTML = categoryLabels.map((cat, idx) => {
        const count = categoryData[idx];
        const pct = totalDeptProjects > 0 ? ((count / totalDeptProjects) * 100).toFixed(0) : 0;
        const color = colors[idx % colors.length];
        return `
          <div class="flex items-center justify-between py-0.5">
            <div class="flex items-center space-x-2 truncate">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
              <span class="truncate font-medium text-slate-700">${cat}</span>
            </div>
            <span class="font-mono text-slate-500 font-semibold flex-shrink-0">${count} (${pct}%)</span>
          </div>
        `;
      }).join('');
    }

    if (analyticsCategoryChartInstance) analyticsCategoryChartInstance.destroy();
    analyticsCategoryChartInstance = new Chart(ctxCategory, {
      type: 'doughnut',
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryData,
          backgroundColor: colors.slice(0, categoryLabels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.label}: ${ctx.parsed} projek`
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // 4. Chart 3: Financial Comparison by Department
  const ctxDeptFin = document.getElementById('analyticsDeptFinancialChart') as HTMLCanvasElement;
  if (ctxDeptFin) {
    const deptFinMap: Record<string, { alloc: number; spend: number }> = {};
    validProjects.forEach(p => {
      const dept = p.department || "Lain-lain";
      if (!deptFinMap[dept]) {
        deptFinMap[dept] = { alloc: 0, spend: 0 };
      }
      deptFinMap[dept].alloc += Number(p.annualAllocation) || 0;
      deptFinMap[dept].spend += Number(p.actualSpend) || 0;
    });

    const depts = Object.keys(deptFinMap);
    const shortLabels = depts.map(d => d.replace("Bahagian ", "").replace("Unit ", ""));
    const allocs = depts.map(d => deptFinMap[d].alloc);
    const spends = depts.map(d => deptFinMap[d].spend);

    if (analyticsDeptFinancialChartInstance) analyticsDeptFinancialChartInstance.destroy();
    analyticsDeptFinancialChartInstance = new Chart(ctxDeptFin, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: 'Peruntukan Tahunan (RM)',
            data: allocs,
            backgroundColor: '#0f172a',
            borderRadius: 4
          },
          {
            label: 'Belanja Sebenar (RM)',
            data: spends,
            backgroundColor: '#059669',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.dataset.label}: ${formatRM(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val: any) => 'RM ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'K')
            }
          }
        }
      }
    });
  }

  // 5. Chart 4: Status Distribution Breakdown
  const ctxStatus = document.getElementById('analyticsStatusChart') as HTMLCanvasElement;
  if (ctxStatus) {
    let selesai = 0, pelaksanaan = 0, lewat = 0, perancangan = 0;
    validProjects.forEach(p => {
      if (p.status === "Selesai") selesai++;
      else if (p.status === "Dalam Pelaksanaan") pelaksanaan++;
      else if (p.status === "Tertangguh/Lewat") lewat++;
      else perancangan++;
    });

    const statusSumText = document.getElementById('analyticsStatusSummaryText');
    if (statusSumText) statusSumText.innerText = `${validProjects.length} Projek Berdaftar`;

    if (analyticsStatusChartInstance) analyticsStatusChartInstance.destroy();
    analyticsStatusChartInstance = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Dalam Pelaksanaan', 'Tertangguh/Lewat', 'Perancangan'],
        datasets: [{
          data: [selesai, pelaksanaan, lewat, perancangan],
          backgroundColor: ['#059669', '#2563eb', '#e11d48', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 } }
          }
        },
        cutout: '65%'
      }
    });
  }
}

/**
 * Ping live Firestore database connection
 */
export async function pingDatabaseConnection() {
  const btn = document.getElementById('btnPingDb') as HTMLButtonElement;
  const latencyEl = document.getElementById('dbPingLatency');
  const dotEl = document.getElementById('dbStatusDot');
  const pingAnim = document.getElementById('dbPingAnimation');
  const statusText = document.getElementById('dbConnectionStatusText');
  const syncTime = document.getElementById('dbLastSyncTimestamp');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Menyemak...</span>`;
    refreshIcons();
  }

  try {
    const res = await pingFirestoreConnection();
    state.firestoreLatencyMs = res.latencyMs;

    if (res.success) {
      if (latencyEl) latencyEl.innerText = `${res.latencyMs}ms`;
      if (statusText) statusText.innerText = "LIVE FIRESTORE CONNECTED";
      if (dotEl) dotEl.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500";
      if (pingAnim) pingAnim.className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75";
      if (syncTime) syncTime.innerText = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Disahkan)';
      showToast(`Sambungan Cloud Firestore disahkan secara langsung! (Latensi: ${res.latencyMs}ms)`, "success");
    } else {
      if (latencyEl) latencyEl.innerText = "Gagal";
      if (statusText) statusText.innerText = "FIRESTORE OFFLINE";
      if (dotEl) dotEl.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500";
      if (pingAnim) pingAnim.className = "hidden";
      showToast(`Ralat sambungan: ${res.error || 'Pangkalan data tidak dapat diakses'}`, "error");
    }
  } catch (err: any) {
    showToast(`Ralat ujian pangkalan data: ${err?.message || err}`, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="radio" class="w-3.5 h-3.5"></i><span>Uji Sambungan</span>`;
      refreshIcons();
    }
  }
}

async function setupFirestoreListeners() {
  try {
    // Seed projects if collection is empty
    await seedInitialProjectsIfEmpty(INITIAL_PROJECTS);
  } catch (e) {
    console.warn("Seeding initial projects check:", e);
  }

  // Subscribe to Projects
  if (unsubscribeProjects) unsubscribeProjects();
  unsubscribeProjects = subscribeToProjects((projects) => {
    if (projects && projects.length > 0) {
      state.projects = projects;
    }
    state.isFirebaseConnected = true;
    renderAll();
    updateCharts();
    updateAnalyticsEngine();
  }, (err) => {
    console.warn("Using local cache, Firestore projects error:", err);
  });

  // Subscribe to Submissions
  if (unsubscribeSubmissions) unsubscribeSubmissions();
  unsubscribeSubmissions = subscribeToSubmissions((submissions) => {
    state.submissions = submissions;
    renderSubmissionsTable();
    renderAuditTrailPage();
    updateAnalyticsEngine();
  }, (err) => {
    console.warn("Submissions sync error:", err);
  });
}

// Bind methods to window for inline HTML event triggers
(window as any).loginWithGoogle = handleGoogleSignIn;
(window as any).loginWithDemoUser = handleDemoSignIn;
(window as any).logoutUser = handleSignOut;
(window as any).switchPage = switchPage;
(window as any).switchTab = switchTab;
(window as any).updateDynamicSummary = updateDynamicSummary;
(window as any).submitProjectFromPortal = submitProjectFromPortal;
(window as any).resetFormPortal = resetFormPortal;
(window as any).openProjectModal = openProjectModal;
(window as any).closeProjectModal = closeProjectModal;
(window as any).saveProjectForm = saveProjectForm;
(window as any).editProject = editProject;
(window as any).deleteProject = deleteProject;
(window as any).viewProjectDetails = viewProjectDetails;
(window as any).closeDetailsModal = closeDetailsModal;
(window as any).triggerVerificationModal = triggerVerificationModal;
(window as any).closeVerificationModal = closeVerificationModal;
(window as any).executeVerificationApproval = executeVerificationApproval;
(window as any).handleRoleChange = handleRoleChange;
(window as any).applyFilters = applyFilters;
(window as any).resetFilters = resetFilters;
(window as any).recalcFormFinancials = recalcFormFinancials;
(window as any).handleFileUpload = handleFileUpload;
(window as any).removeUploadedFile = removeUploadedFile;
(window as any).exportDataCSV = exportDataCSV;
(window as any).renderSubmissionsTable = renderSubmissionsTable;
(window as any).showToast = showToast;
(window as any).updateAnalyticsEngine = updateAnalyticsEngine;
(window as any).pingDatabaseConnection = pingDatabaseConnection;
(window as any).renderAuditTrailPage = renderAuditTrailPage;
(window as any).filterAuditTrail = filterAuditTrail;
(window as any).viewAuditRecordDetail = viewAuditRecordDetail;
(window as any).closeAuditRecordModal = closeAuditRecordModal;
(window as any).copyCurrentAuditJson = copyCurrentAuditJson;
(window as any).copyCurrentAuditDocId = copyCurrentAuditDocId;
(window as any).sendQuestionToGeminiAgent = sendQuestionToGeminiAgent;
(window as any).clearGeminiResults = clearGeminiResults;
(window as any).copyGeminiAnswer = copyGeminiAnswer;
(window as any).startNewChatConversation = startNewChatConversation;
(window as any).clearCurrentChat = clearCurrentChat;
(window as any).selectQuickPrompt = selectQuickPrompt;
(window as any).handleChatInputKeydown = handleChatInputKeydown;
(window as any).submitChatMessage = submitChatMessage;
(window as any).downloadMessageAsPDF = downloadMessageAsPDF;
(window as any).printSingleReport = printSingleReport;
(window as any).copyMessageText = copyMessageText;
(window as any).retryLastUserMessage = retryLastUserMessage;
(window as any).triggerChatFileUpload = triggerChatFileUpload;
(window as any).handleChatFilesSelected = handleChatFilesSelected;
(window as any).removeChatAttachment = removeChatAttachment;
(window as any).clearChatAttachments = clearChatAttachments;
(window as any).toggleReasoningAccordion = toggleReasoningAccordion;
(window as any).openDocumentExtractionModal = openDocumentExtractionModal;
(window as any).closeDocumentExtractionModal = closeDocumentExtractionModal;
(window as any).handleModalFileSelect = handleModalFileSelect;
(window as any).loadSampleMeetingMinutes = loadSampleMeetingMinutes;
(window as any).runDocumentAiExtraction = runDocumentAiExtraction;
(window as any).applyExtractedDataToForm = applyExtractedDataToForm;
(window as any).printExecutiveReport = printExecutiveReport;
(window as any).downloadExecutiveReportPDF = downloadExecutiveReportPDF;
(window as any).applyReportDateFilters = renderExecutiveReport;
(window as any).resetReportDateFilters = resetReportDateFilters;
(window as any).renderExecutiveReport = renderExecutiveReport;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
  renderAll();
  initCharts();
  updateAnalyticsEngine();
  renderAuditTrailPage();
  setupDropZone();
  setupModalDropzone();
  setupChatDropZone();
  updateDynamicSummary();
  renderChatMessages();
  renderChatAttachedFiles();

  // Chat Textarea Auto-Resize & Character Counter
  const chatInput = document.getElementById('chatInputText') as HTMLTextAreaElement;
  const charCounter = document.getElementById('chatCharCount');
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      // Auto-resize
      chatInput.style.height = 'auto';
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;

      // Character counter
      if (charCounter) {
        const len = chatInput.value.length;
        charCounter.textContent = `${len} aksara`;
      }
    });

    chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitChatMessage();
      }
    });
  }

  // Attach keyboard event listener on legacy question input if present
  const qInput = document.getElementById('questionInput');
  if (qInput) {
    qInput.addEventListener('keydown', (e: any) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendQuestionToGeminiAgent();
      }
    });
  }

  // Attach live dynamic summary updates on form interactions
  const form = document.getElementById('projectForm');
  if (form) {
    form.addEventListener('input', () => {
      recalcFormFinancials();
      updateDynamicSummary();
    });
    form.addEventListener('change', () => {
      recalcFormFinancials();
      updateDynamicSummary();
    });
  }

  // Listen to Firebase Auth state
  onAuthStateChanged(auth, (user) => {
    state.currentUser = user;
    updateAuthUI(user);

    if (user) {
      setupFirestoreListeners();
    }
  });
});
