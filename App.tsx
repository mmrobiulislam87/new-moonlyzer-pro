import React, { useState, useMemo, useEffect } from 'react';
import { Database, LayoutDashboard, Share2, Link2, SignalHigh, Smartphone, GitFork, LocateFixed, TrendingUp, UserCog, Repeat, ShieldAlert, MapPinned, Users2, UserSearch, Map as MapRouteIcon, Globe, ListTree, Activity, PackageOpen, Route, Network, BrainCircuit, MapPin, TowerControl, Clock, ListFilter, Target, Thermometer, Replace, MessageSquare, Search as SearchIconLucide, Sparkles, CreditCard, BarChartHorizontalBig, Flag, Landmark, Pocket, Rocket, ListChecks, Layers, DatabaseZap, Mailbox, Download as DownloadIcon, Trash2, KeyRound, SquareDashedBottomCode, Waypoints, ChevronDown, ChevronRight, Briefcase, ScanFace, Lock, ArrowLeftRight, Send } from 'lucide-react';
import FileUpload from './components/FileUpload';
import IPDRFileUpload from './components/IPDRFileUpload';
import LACFileUpload from './components/LACFileUpload';
import SMSFileUpload from './components/SMSFileUpload';
import NagadFileUpload from './components/NagadFileUpload';
import BkashFileUpload from './components/BkashFileUpload';
import RoketFileUpload from './components/RoketFileUpload';
import VoIPFileUpload from './components/VoIPFileUpload';
import LinkAnalysisView from './components/LinkAnalysisView';
import { Header } from './components/Layout';
import { Tab, Tabs } from './components/Tabs';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import DataView from './components/DataView';
import TowerActivityView from './components/TowerActivityView';
import GraphView from './components/GraphView';
import DeviceAnalysisView from './components/DeviceAnalysisView';
import ConversationChainView from './components/ConversationChainView';
import LocationTimelineView from './components/LocationTimelineView';
import NumberActivityExplorer from './components/NumberActivityExplorer';
import BehavioralFingerprintView from './components/BehavioralFingerprintView';
import DeviceSwapView from './components/DeviceSwapView';
import AnomalyDetectionView from './components/AnomalyDetectionView';
import LocationContactAnalysisView from './components/LocationContactAnalysisView';
import SuspectProfilingView from './components/SuspectProfilingView';
import IPDRDataView from './components/IPDRDataView';
import GeoAnalysisView from './components/GeoAnalysisView';
import IPDRBrowsingBehaviorView from './components/IPDRBrowsingBehaviorView';
import IPDRAppUsageView from './components/IPDRAppUsageView';
import IPDRUserActivityView from './components/IPDRUserActivityView';
import IPDRIPAddressProfilerView from './components/IPDRIPAddressProfilerView';
import IPDRDeviceLinkageView from './components/IPDRDeviceLinkageView';
import IPDRDomainAnalysisView from './components/IPDRDomainAnalysisView';
import IPDRGeminiInsightsView from './components/IPDRGeminiInsightsView';
import IPDRSocialMediaView from './components/IPDRSocialMediaView';
import LACDataView from './components/LACDataView';
import LACSameTimeSameTowerView from './components/LACSameTimeSameTowerView';
import LACFrequentPresenceView from './components/LACFrequentPresenceView';
import LACMultiSimImeiView from './components/LACMultiSimImeiView';
import LACCallSmsLinkView from './components/LACCallSmsLinkView';
import LACTimeBasedFilterView from './components/LACTimeBasedFilterView';
import LACSuspiciousPatternView from './components/LACSuspiciousPatternView';
import LACImeiChangeDetectView from './components/LACImeiChangeDetectView';
import LACTowerTravelPatternView from './components/LACTowerTravelPatternView';
import TowerDatabaseUploader from './components/TowerDatabaseUploader';
import CellTowerLocatorView from './components/CellTowerLocatorView';
import SMSDataView from './components/SMSDataView';
import SMSDashboardView from './components/SMSDashboardView';
import SMSRechargeView from './components/SMSRechargeView';
import SMSContentSearchView from './components/SMSContentSearchView';
import SMSContactLinksView from './components/SMSContactLinksView';
import SMSTimelineView from './components/SMSTimelineView';
import SMSAlertFlaggingView from './components/SMSAlertFlaggingView';
import NagadDataView from './components/NagadDataView';
import NagadTransactionDashboard from './components/NagadTransactionDashboard';
import NagadFrequentContactsView from './components/NagadFrequentContactsView';
import NagadNetworkVisualizer from './components/NagadNetworkVisualizer';
import NagadSuspiciousActivityView from './components/NagadSuspiciousActivityView';
import NagadTransactionTimelineView from './components/NagadTransactionTimelineView';
import BkashDataView from './components/BkashDataView';
import BkashTransactionDashboard from './components/BkashTransactionDashboard';
import BkashNetworkVisualizer from './components/BkashNetworkVisualizer';
import BkashFrequentContactsView from './components/BkashFrequentContactsView';
import BkashSuspiciousActivityView from './components/BkashSuspiciousActivityView';
import BkashCashFlowView from './components/BkashCashFlowView';
import BkashAirtimeAnalysisView from './components/BkashAirtimeAnalysisView';
import BkashPaymentAnalysisView from './components/BkashPaymentAnalysisView';
import BkashSendMoneyView from './components/BkashSendMoneyView';
import MFSLandingView from './components/MFSLandingView';
import RoketDataView from './components/RoketDataView';
import LicenseManagerView from './components/LicenseManagerView';
import DuplicateDataRemovalView from './components/DuplicateDataRemovalView';
import BTSLocationSearchView from './components/BTSLocationSearchView';
import InvestigationFilesView from './components/InvestigationFilesView';
import SuspectRecognitionView from './components/SuspectRecognitionView';
import VoIPDataView from './components/VoIPDataView';
import VoIPDashboard from './components/VoIPDashboard';
import VoIPGraphView from './components/VoIPGraphView';
import VoIPIPAddressProfilerView from './components/VoIPIPAddressProfilerView';
import VoIPAppIdentificationView from './components/VoIPAppIdentificationView';
import { MainView, AppView, RibbonGroupConfig, LicenseLevel } from './types';
import RibbonToolbar from './components/RibbonToolbar';
import { useLicense } from './contexts/LicenseContext';

// --- View Definitions ---
const mainViews: AppView[] = [
  { id: 'data', title: 'CDR Analysis', icon: <Database size={17} className="text-primary-dark" />, category: 'cdr', isMainTab: true, parentViewId: undefined },
  { id: 'ipdrAnalysis', title: 'IPDR Analysis', icon: <Globe size={17} className="text-amber-600"/>, category: 'ipdr', isMainTab: true, parentViewId: undefined },
  { id: 'lacAnalysis', title: 'LAC & Cell Analysis', icon: <TowerControl size={17} className="text-cyan-600"/>, category: 'lac', isMainTab: true, parentViewId: undefined },
  { id: 'smsAnalysis', title: 'SMS Analysis', icon: <MessageSquare size={17} className="text-orange-600"/>, category: 'sms', isMainTab: true, parentViewId: undefined },
  { id: 'ipNumberAnalysis', title: 'IP Number Analysis', icon: <SquareDashedBottomCode size={17} className="text-indigo-600" />, category: 'voip', isMainTab: true, parentViewId: undefined },
  { id: 'mobileFinanceAnalysis', title: 'Mobile Finance Analysis', icon: <Landmark size={17} className="text-emerald-600"/>, category: 'mfs', isMainTab: true, parentViewId: undefined },
  { id: 'investigationFiles', title: 'Investigation Files', icon: <Briefcase size={17} className="text-slate-600" />, category: 'investigation', isMainTab: true, parentViewId: undefined },
  { id: 'suspectRecognition', title: 'Suspect Recognition', icon: <ScanFace size={17} className="text-teal-500" />, category: 'recognition', isMainTab: true, parentViewId: undefined, requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'licenseManagement', title: 'License', icon: <KeyRound size={17} className="text-yellow-600"/>, category: 'license', isMainTab: true, parentViewId: undefined },
];

const cdrViews: AppView[] = [
  { id: 'data', title: 'CDR Data Grid', icon: <ListTree size={28} className="text-blue-600" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'summary', title: 'CDR Summary', icon: <LayoutDashboard size={28} className="text-blue-600" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'graph', title: 'Graph Analysis', icon: <Share2 size={28} className="text-blue-700" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'suspectProfiling', title: 'Suspect Profiling', icon: <UserSearch size={28} className="text-blue-700" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'activityRanking', title: 'Activity Ranking', icon: <TrendingUp size={28} className="text-blue-500" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'behavioralMatching', title: 'Behavioral Matching', icon: <UserCog size={28} className="text-blue-800" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'anomalyDetection', title: 'Anomaly Detection (AI)', icon: <ShieldAlert size={28} className="text-red-600" />, category: 'cdr', isMainTab: false, parentViewId: 'data', requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'locationContactAnalysis', title: 'Location Contact', icon: <><MapPinned size={22} className="text-blue-700" /><Users2 size={22} className="text-blue-700 ml-0.5"/></>, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'towerActivity', title: 'Tower Activity', icon: <SignalHigh size={28} className="text-blue-500" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'deviceAnalysis', title: 'Device Analysis', icon: <Smartphone size={28} className="text-blue-500" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'deviceSwaps', title: 'Device Swaps', icon: <Repeat size={28} className="text-blue-600" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'interMatch', title: 'Inter-CDR Links', icon: <Link2 size={28} className="text-blue-600" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'conversationChains', title: 'Conversation Chains', icon: <GitFork size={28} className="text-blue-700" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'locationTimeline', title: 'Location Timeline', icon: <LocateFixed size={28} className="text-blue-700" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'geoAnalysis', title: 'Geospatial Overview', icon: <MapRouteIcon size={28} className="text-blue-800" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
  { id: 'duplicateRemoval', title: 'Duplicate Removal', icon: <Layers size={28} className="text-blue-500" />, category: 'cdr', isMainTab: false, parentViewId: 'data' },
];

const ipdrViews: AppView[] = [
  { id: 'ipdrDataView', title: 'IPDR Data Grid', icon: <Database size={28} className="text-amber-600" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrUserActivity', title: 'User Activity', icon: <UserSearch size={28} className="text-amber-600" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrIpProfiler', title: 'IP Profiler', icon: <MapPin size={28} className="text-amber-700" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrDeviceLinkage', title: 'Device Linkage', icon: <Smartphone size={28} className="text-amber-700" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrBrowsingBehavior', title: 'Browsing Behavior', icon: <Activity size={28} className="text-amber-500" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrAppUsage', title: 'Application Usage', icon: <PackageOpen size={28} className="text-amber-500" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrDomainAnalysis', title: 'Domain Analysis', icon: <Network size={28} className="text-amber-800" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrSocialMediaAnalysis', title: 'Social Media Analysis', icon: <Waypoints size={28} className="text-amber-800" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis' },
  { id: 'ipdrGeminiInsights', title: 'AI-Powered Insights', icon: <BrainCircuit size={28} className="text-purple-600" />, category: 'ipdr', isMainTab: false, parentViewId: 'ipdrAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
];

const lacViews: AppView[] = [
  { id: 'lacDataView', title: 'LAC Data Grid', icon: <ListTree size={28} className="text-cyan-600" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'towerDatabase', title: 'Tower Database', icon: <DatabaseZap size={28} className="text-cyan-600" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacSameTimeSameTower', title: 'Same Time, Same Tower', icon: <><Users2 size={22} className="text-cyan-700" /><Clock size={22} className="text-cyan-700 ml-0.5" /></>, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacFrequentPresence', title: 'Frequent Presence', icon: <Repeat size={28} className="text-cyan-500" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacMultiSimImei', title: 'Multi-SIM IMEI Linkage', icon: <><Smartphone size={22} className="text-cyan-800" /><Users2 size={22} className="text-cyan-800 ml-0.5" /></>, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacCallSmsLink', title: 'Call/SMS Link Analysis', icon: <Share2 size={28} className="text-cyan-500" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacTimeBasedFilter', title: 'Time-based Filtering', icon: <ListFilter size={28} className="text-cyan-700" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacSuspiciousPattern', title: 'Suspicious Patterns (AI)', icon: <BrainCircuit size={28} className="text-purple-600" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'lacImeiChangeDetect', title: 'IMEI Change Detector', icon: <><Smartphone size={22} className="text-cyan-800" /><Repeat size={22} className="text-cyan-800 ml-0.5" /></>, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'lacTowerTravelPattern', title: 'Tower Travel Pattern', icon: <Route size={28} className="text-cyan-700" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'btsLocationSearch', title: 'BTS Location Search', icon: <MapRouteIcon size={28} className="text-cyan-500" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
  { id: 'towerLocator', title: 'Tower Locator', icon: <MapPin size={28} className="text-cyan-800" />, category: 'lac', isMainTab: false, parentViewId: 'lacAnalysis' },
];

const smsViews: AppView[] = [
  { id: 'smsDataView', title: 'SMS Data Grid', icon: <ListTree size={28} className="text-orange-600" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsDashboardView', title: 'SMS Dashboard', icon: <BarChartHorizontalBig size={28} className="text-orange-600" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsRechargeView', title: 'Recharge Tracker', icon: <CreditCard size={28} className="text-orange-700" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsContentSearch', title: 'Content Search', icon: <SearchIconLucide size={28} className="text-orange-500" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsContactLinks', title: 'Contact Links', icon: <Users2 size={28} className="text-orange-500" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsTimelineView', title: 'Activity Timeline', icon: <Activity size={28} className="text-orange-700" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis' },
  { id: 'smsAlertFlagging', title: 'Alert & Flagging (AI)', icon: <ShieldAlert size={28} className="text-red-600" />, category: 'sms', isMainTab: false, parentViewId: 'smsAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
];

const voipViews: AppView[] = [
  { id: 'voipDataGrid', title: 'VoIP Data Grid', icon: <ListTree size={28} className="text-indigo-500" />, category: 'voip', isMainTab: false, parentViewId: 'ipNumberAnalysis' },
  { id: 'voipDashboard', title: 'VoIP Summary', icon: <LayoutDashboard size={28} className="text-indigo-500" />, category: 'voip', isMainTab: false, parentViewId: 'ipNumberAnalysis' },
  { id: 'voipGraph', title: 'Graph Analysis', icon: <Share2 size={28} className="text-indigo-600" />, category: 'voip', isMainTab: false, parentViewId: 'ipNumberAnalysis' },
  { id: 'voipIpProfiler', title: 'IP Address Profiler', icon: <MapPin size={28} className="text-indigo-600" />, category: 'voip', isMainTab: false, parentViewId: 'ipNumberAnalysis' },
  { id: 'voipAppId', title: 'VoIP App ID (AI)', icon: <Sparkles size={28} className="text-purple-600" />, category: 'voip', isMainTab: false, parentViewId: 'ipNumberAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
];

const mfsViews: AppView[] = [
  { id: 'nagadAnalysis', title: 'Nagad Analysis', icon: <Mailbox size={28} className="text-emerald-500" />, category: 'mfs', isMainTab: false, parentViewId: 'mobileFinanceAnalysis', isServiceGroup: true },
  { id: 'bkashAnalysis', title: 'bKash Analysis', icon: <Pocket size={28} className="text-pink-500" />, category: 'mfs', isMainTab: false, parentViewId: 'mobileFinanceAnalysis', isServiceGroup: true },
  { id: 'roketAnalysis', title: 'Roket Analysis', icon: <Rocket size={28} className="text-purple-500" />, category: 'mfs', isMainTab: false, parentViewId: 'mobileFinanceAnalysis', isServiceGroup: true },
  { id: 'nagadDataGrid', title: 'Data Grid', icon: <ListTree size={28} className="text-emerald-600" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis' },
  { id: 'nagadTransactionDashboard', title: 'Dashboard', icon: <LayoutDashboard size={28} className="text-emerald-600" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis' },
  { id: 'nagadFrequentContacts', title: 'Frequent Contacts', icon: <Users2 size={28} className="text-emerald-700" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis' },
  { id: 'nagadNetworkVisualizer', title: 'Network Visualizer', icon: <Share2 size={28} className="text-emerald-500" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis' },
  { id: 'nagadSuspiciousActivity', title: 'Suspicious Activity (AI)', icon: <ShieldAlert size={28} className="text-red-600" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'nagadTransactionTimeline', title: 'Transaction Timeline', icon: <ListChecks size={28} className="text-emerald-700" />, category: 'mfs', isMainTab: false, parentViewId: 'nagadAnalysis' },
  { id: 'bkashDataGrid', title: 'Data Grid', icon: <ListTree size={28} className="text-pink-600" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashTransactionDashboard', title: 'Dashboard', icon: <LayoutDashboard size={28} className="text-pink-600" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashFrequentContacts', title: 'Frequent Contacts', icon: <Users2 size={28} className="text-pink-700" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashNetworkVisualizer', title: 'Network Visualizer', icon: <Share2 size={28} className="text-pink-500" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashSuspiciousActivity', title: 'Suspicious Activity (AI)', icon: <ShieldAlert size={28} className="text-red-600" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'bkashCashFlow', title: 'Cash Flow', icon: <ArrowLeftRight size={28} className="text-pink-500" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashAirtime', title: 'Airtime', icon: <Smartphone size={28} className="text-pink-700" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashPayment', title: 'Payment', icon: <CreditCard size={28} className="text-pink-700" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'bkashSendMoney', title: 'Send Money', icon: <Send size={28} className="text-pink-500" />, category: 'mfs', isMainTab: false, parentViewId: 'bkashAnalysis' },
  { id: 'roketDataGrid', title: 'Data Grid', icon: <ListTree size={28} className="text-purple-600" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis' },
  { id: 'roketTransactionDashboard', title: 'Dashboard', icon: <LayoutDashboard size={28} className="text-purple-600" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis' },
  { id: 'roketFrequentContacts', title: 'Frequent Contacts', icon: <Users2 size={28} className="text-purple-700" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis' },
  { id: 'roketNetworkVisualizer', title: 'Network Visualizer', icon: <Share2 size={28} className="text-purple-500" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis' },
  { id: 'roketSuspiciousActivity', title: 'Suspicious Activity (AI)', icon: <ShieldAlert size={28} className="text-red-600" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis', requiredLicense: LicenseLevel.PROFESSIONAL },
  { id: 'roketTransactionTimeline', title: 'Transaction Timeline', icon: <ListChecks size={28} className="text-purple-700" />, category: 'mfs', isMainTab: false, parentViewId: 'roketAnalysis' },
];

const investigationViews: AppView[] = [
  { id: 'investigationFiles', title: 'Case Management', icon: <Briefcase size={28} className="text-slate-600" />, category: 'investigation', isMainTab: false, parentViewId: 'investigationFiles' },
];

const recognitionViews: AppView[] = [
  { id: 'suspectRecognition', title: 'Upload & Search', icon: <ScanFace size={28} className="text-teal-600" />, category: 'recognition', isMainTab: false, parentViewId: 'suspectRecognition' },
];

export const appViews: AppView[] = [
  ...mainViews,
  ...cdrViews,
  ...ipdrViews,
  ...lacViews,
  ...smsViews,
  ...voipViews,
  ...mfsViews,
  ...investigationViews,
  ...recognitionViews,
];

const componentMap: Record<string, React.FC<any>> = {
  // CDR
  'data': DataView, 'summary': AnalyticsDashboard, 'graph': GraphView, 'interMatch': LinkAnalysisView,
  'towerActivity': TowerActivityView, 'deviceAnalysis': DeviceAnalysisView, 'conversationChains': ConversationChainView,
  'locationTimeline': LocationTimelineView, 'behavioralMatching': BehavioralFingerprintView, 'deviceSwaps': DeviceSwapView,
  'anomalyDetection': AnomalyDetectionView, 'locationContactAnalysis': LocationContactAnalysisView,
  'suspectProfiling': SuspectProfilingView, 'geoAnalysis': GeoAnalysisView, 'duplicateRemoval': DuplicateDataRemovalView,
  // IPDR
  'ipdrAnalysis': IPDRDataView, 'ipdrDataView': IPDRDataView, 'ipdrUserActivity': IPDRUserActivityView,
  'ipdrIpProfiler': IPDRIPAddressProfilerView, 'ipdrDeviceLinkage': IPDRDeviceLinkageView,
  'ipdrBrowsingBehavior': IPDRBrowsingBehaviorView, 'ipdrAppUsage': IPDRAppUsageView, 'ipdrDomainAnalysis': IPDRDomainAnalysisView,
  'ipdrSocialMediaAnalysis': IPDRSocialMediaView, 'ipdrGeminiInsights': IPDRGeminiInsightsView,
  // LAC
  'lacAnalysis': LACDataView, 'lacDataView': LACDataView, 'lacSameTimeSameTower': LACSameTimeSameTowerView,
  'lacFrequentPresence': LACFrequentPresenceView, 'lacMultiSimImei': LACMultiSimImeiView, 'lacCallSmsLink': LACCallSmsLinkView,
  'lacTimeBasedFilter': LACTimeBasedFilterView, 'lacSuspiciousPattern': LACSuspiciousPatternView,
  'lacImeiChangeDetect': LACImeiChangeDetectView, 'lacTowerTravelPattern': LACTowerTravelPatternView,
  'towerDatabase': TowerDatabaseUploader, 'btsLocationSearch': BTSLocationSearchView, 'towerLocator': CellTowerLocatorView,
  // SMS
  'smsAnalysis': SMSDataView, 'smsDataView': SMSDataView, 'smsDashboardView': SMSDashboardView,
  'smsRechargeView': SMSRechargeView, 'smsContentSearch': SMSContentSearchView, 'smsContactLinks': SMSContactLinksView,
  'smsTimelineView': SMSTimelineView, 'smsAlertFlagging': SMSAlertFlaggingView,
  // VoIP
  'ipNumberAnalysis': VoIPDataView, 'voipDataGrid': VoIPDataView, 'voipDashboard': VoIPDashboard,
  'voipGraph': VoIPGraphView, 'voipIpProfiler': VoIPIPAddressProfilerView, 'voipAppId': VoIPAppIdentificationView,
  // MFS
  'mobileFinanceAnalysis': MFSLandingView, 'nagadAnalysis': NagadDataView, 'bkashAnalysis': BkashDataView,
  'roketAnalysis': RoketDataView, 'nagadDataGrid': NagadDataView, 'nagadTransactionDashboard': NagadTransactionDashboard,
  'nagadFrequentContacts': NagadFrequentContactsView, 'nagadNetworkVisualizer': NagadNetworkVisualizer,
  'nagadSuspiciousActivity': NagadSuspiciousActivityView, 'nagadTransactionTimeline': NagadTransactionTimelineView,
  'bkashDataGrid': BkashDataView, 'bkashTransactionDashboard': BkashTransactionDashboard,
  'bkashFrequentContacts': BkashFrequentContactsView, 'bkashNetworkVisualizer': BkashNetworkVisualizer,
  'bkashSuspiciousActivity': BkashSuspiciousActivityView, 'bkashCashFlow': BkashCashFlowView,
  'bkashAirtime': BkashAirtimeAnalysisView, 'bkashPayment': BkashPaymentAnalysisView, 'bkashSendMoney': BkashSendMoneyView,
  'roketDataGrid': RoketDataView, 'roketTransactionDashboard': RoketDataView, 'roketFrequentContacts': RoketDataView,
  'roketNetworkVisualizer': RoketDataView, 'roketSuspiciousActivity': RoketDataView, 'roketTransactionTimeline': RoketDataView,
  // Investigation, Recognition & Admin
  'investigationFiles': InvestigationFilesView, 
  'suspectRecognition': SuspectRecognitionView,
  'licenseManagement': LicenseManagerView,
};

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="border border-neutral-light rounded-lg bg-surface shadow-sm">
      <button
        className="w-full flex items-center justify-between p-2 text-left text-sm font-semibold text-textPrimary hover:bg-neutral-lightest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {isOpen && <div className="p-1 border-t border-neutral-light">{children}</div>}
    </div>
);


const App: React.FC = () => {
  const { isFeatureAllowed } = useLicense();
  const [activeMainTabView, setActiveMainTabView] = useState<MainView>('data');
  const [activeContentView, setActiveContentView] = useState<MainView>('data');
  const [openUploads, setOpenUploads] = useState<Record<string, boolean>>({
      cdr: true,
      ipdr: false,
      lac: false,
      sms: false,
      mfs: false,
      voip: false,
  });

  const toggleUploadSection = (section: string) => {
    setOpenUploads(prev => ({...prev, [section]: !prev[section]}));
  };

  const handleSelectMainTab = (viewId: MainView) => {
    const firstSubView = appViews.find(v => v.parentViewId === viewId && !v.isServiceGroup);
    setActiveMainTabView(viewId);
    setActiveContentView(firstSubView ? firstSubView.id : viewId);
  };

  const handleSelectContentView = (viewId: MainView) => {
    setActiveContentView(viewId);
  };
  
  const onRibbonAction = (actionType: string, targetViewId?: string) => {
    const targetView = appViews.find(v => v.id === targetViewId);
    if (targetViewId && targetView && actionType === 'navigateToView') {
      handleSelectContentView(targetViewId as MainView);
    }
  };
  
  const ribbonGroups: RibbonGroupConfig[] = useMemo(() => {
    const subViews = appViews.filter(v => v.parentViewId === activeMainTabView);
    if (subViews.length === 0) return [];
    
    if (activeMainTabView === 'mobileFinanceAnalysis') {
        const serviceGroups = subViews.filter(v => v.isServiceGroup);
        return serviceGroups.map(sg => ({
            id: sg.id,
            name: sg.title,
            actions: appViews
                .filter(v => v.parentViewId === sg.id)
                .map(v => {
                    const isDisabled = !!(v.requiredLicense && !isFeatureAllowed(v.requiredLicense));
                    return {
                        id: `navigateToView_${v.id}`,
                        label: v.title,
                        icon: isDisabled ? <Lock size={28} className="text-neutral-DEFAULT"/> : v.icon,
                        actionType: 'navigateToView',
                        targetViewId: v.id,
                        displayType: 'large',
                        disabled: isDisabled,
                        tooltip: isDisabled ? 'Upgrade to unlock this feature' : v.title,
                    };
                })
        }));
    }
    
    return [{
        id: activeMainTabView,
        actions: subViews.map(v => {
            const isDisabled = !!(v.requiredLicense && !isFeatureAllowed(v.requiredLicense));
            return {
                id: `navigateToView_${v.id}`,
                label: v.title,
                icon: isDisabled ? <Lock size={28} className="text-neutral-DEFAULT"/> : v.icon,
                actionType: 'navigateToView',
                targetViewId: v.id,
                displayType: 'large',
                disabled: isDisabled,
                tooltip: isDisabled ? 'Upgrade to unlock this feature' : v.title,
            };
        })
    }];
  }, [activeMainTabView, isFeatureAllowed]);

  const renderView = (view: MainView) => {
    if (view === 'activityRanking') {
        return <NumberActivityExplorer setActiveView={handleSelectContentView} />;
    }

    const Component = componentMap[view];
    if (Component) {
      return <Component />;
    }

    return <div className="p-6 bg-neutral-lightest rounded-lg"><h2 className="text-xl font-bold">View Not Found</h2><p>The selected view '{view}' is not implemented or has been removed.</p></div>;
  };

  const mainTabs = useMemo(() => appViews.filter(v => v.isMainTab), []);

  return (
    <div className="flex flex-col h-screen bg-background text-textPrimary">
      <Header title="Zenius Moonlyzer Pro" className="flex-shrink-0" />
      <div className="flex flex-row flex-grow min-h-0">
        <aside className="w-80 flex-shrink-0 bg-neutral-lightest border-r border-neutral-light p-2 flex flex-col space-y-2 overflow-y-auto scrollbar-thin">
           <h2 className="text-lg font-bold text-textPrimary px-2 pt-2 pb-3 border-b border-neutral-light">File Management</h2>
           <CollapsibleSection title="CDR" icon={<Database size={16} className="text-primary"/>} isOpen={openUploads.cdr} onToggle={() => toggleUploadSection('cdr')}>
              <FileUpload />
           </CollapsibleSection>
           <CollapsibleSection title="IPDR" icon={<Globe size={16} className="text-accent"/>} isOpen={openUploads.ipdr} onToggle={() => toggleUploadSection('ipdr')}>
              <IPDRFileUpload />
           </CollapsibleSection>
            <CollapsibleSection title="LAC/Cell" icon={<TowerControl size={16} className="text-info"/>} isOpen={openUploads.lac} onToggle={() => toggleUploadSection('lac')}>
              <LACFileUpload />
           </CollapsibleSection>
           <CollapsibleSection title="SMS" icon={<MessageSquare size={16} className="text-warning"/>} isOpen={openUploads.sms} onToggle={() => toggleUploadSection('sms')}>
              <SMSFileUpload />
           </CollapsibleSection>
           <CollapsibleSection title="IP Number (VoIP)" icon={<SquareDashedBottomCode size={16} className="text-indigo-500"/>} isOpen={openUploads.voip} onToggle={() => toggleUploadSection('voip')}>
              <VoIPFileUpload />
           </CollapsibleSection>
            <CollapsibleSection title="Mobile Finance" icon={<Landmark size={16} className="text-success"/>} isOpen={openUploads.mfs} onToggle={() => toggleUploadSection('mfs')}>
              <div className="space-y-4 p-2">
                <NagadFileUpload />
                <BkashFileUpload />
                <RoketFileUpload />
              </div>
           </CollapsibleSection>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
            <div className="relative z-20 flex items-center p-3 border-b border-neutral-light shadow-sm bg-surface">
              <Tabs>
                {mainTabs.map(view => {
                  const isDisabled = !!(view.requiredLicense && !isFeatureAllowed(view.requiredLicense));
                  return (
                    <Tab 
                      key={view.id} 
                      title={isDisabled ? `${view.title} (Locked)` : view.title} 
                      icon={isDisabled ? <Lock size={14}/> : view.icon} 
                      isActive={activeMainTabView === view.id} 
                      onClick={() => handleSelectMainTab(view.id)} 
                      disabled={isDisabled}
                      tooltip={isDisabled ? 'Upgrade your license to unlock this feature' : undefined}
                    />
                  )
                })}
              </Tabs>
            </div>
            <RibbonToolbar 
              activeMainTabView={activeMainTabView} 
              groups={ribbonGroups} 
              onAction={(actionType, targetViewId, actionId) => onRibbonAction(actionType, targetViewId)}
              activeContentView={activeContentView}
            />
            <main className="flex-grow p-4 overflow-y-auto main-view-container scrollbar-thin bg-background">
              {renderView(activeContentView)}
            </main>
        </div>
      </div>
    </div>
  );
};

export default App;