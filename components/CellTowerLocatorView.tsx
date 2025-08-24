
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, XCircle, Loader2, Link2, Share2, Compass, Trash2, Layers, Download, LocateFixed, Sun, Moon, AlertTriangle } from 'lucide-react';
import GoogleMapView from './GoogleMapView'; 
import { cn } from '../utils/cn';
import { MapMarkerData, MapPathData } from '../types';

const UNWIREDLABS_API_KEY = 'pk.0109ed396038127c16979e91be9a0832';
const OPENCAGE_API_KEY = '9831579677c649c0a677f08392cb7548';

interface SearchHistoryItem {
    mcc: string;
    mnc: string;
    lac: string;
    cellId: string;
    timestamp: string;
}

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },{ elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },{ featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },{ featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },{ featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },{ featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },{ featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },{ featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },{ featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },{ featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const CellTowerLocatorView: React.FC = () => {
    const [formState, setFormState] = useState({ mcc: '470', mnc: '', lac: '', cellId: '' });
    const [distanceTarget, setDistanceTarget] = useState({ lat: '', lon: '' });
    const [resultHtml, setResultHtml] = useState<string | null>(null);
    const [distanceResultHtml, setDistanceResultHtml] = useState<string | null>(null);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionButtonsDisabled, setIsActionButtonsDisabled] = useState(true);
    const [isDistanceSectionVisible, setIsDistanceSectionVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
    
    const [mapMarkers, setMapMarkers] = useState<MapMarkerData[]>([]);
    const [mapPaths, setMapPaths] = useState<MapPathData[]>([]);
    const [mapCenter, setMapCenter] = useState({ lat: 23.6850, lng: 90.3563 });
    const [mapZoom, setMapZoom] = useState(7);
    const [isMapVisible, setIsMapVisible] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleDistanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDistanceTarget(prev => ({ ...prev, [name]: value }));
    };
    
    const updateUrlParameters = (mcc: string, mnc: string, lac: string, cellId: string) => {
        const params = new URLSearchParams({ mcc, mnc, lac, cellId });
        // window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    };
    
    const updateHistory = useCallback((item: Omit<SearchHistoryItem, 'timestamp'>) => {
        setSearchHistory(prev => {
            const newHistory = [
                { ...item, timestamp: new Date().toISOString() },
                ...prev.filter(h => !(h.mcc === item.mcc && h.mnc === item.mnc && h.lac === item.lac && h.cellId === item.cellId))
            ].slice(0, 10);
            localStorage.setItem('towerSearchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const findLocation = useCallback(async (searchParams?: Omit<SearchHistoryItem, 'timestamp'>) => {
        const params = searchParams || formState;
        const { mcc, mnc, lac, cellId } = params;

        if (!mcc || !mnc || !lac || !cellId) { alert('সব ফিল্ড পূরণ করুন।'); return; }
        if (!window.google || !window.google.maps) { alert('গুগল ম্যাপস লোড হয়নি।'); return; }

        setIsLoading(true);
        setResultHtml('লোকেশন অনুসন্ধান করা হচ্ছে...');
        setIsActionButtonsDisabled(true);
        setMapPaths([]);
        setDistanceResultHtml(null);
        
        try {
            const uwResponse = await fetch('https://us1.unwiredlabs.com/v2/process.php', {
                method: 'POST', body: JSON.stringify({ token: UNWIREDLABS_API_KEY, radio: "gsm", mcc: parseInt(mcc), mnc: parseInt(mnc), cells: [{ lac: parseInt(lac), cid: parseInt(cellId) }], address: 1 })
            });
            if (!uwResponse.ok) throw new Error(`UnwiredLabs API error: ${uwResponse.statusText}`);
            const uwData = await uwResponse.json();
            if (uwData.status !== "ok" || !uwData.lat || !uwData.lon) throw new Error(uwData.message || "UnwiredLabs থেকে ডেটা পাওয়া যায়নি।");
            
            let address = uwData.address || "ঠিকানা পাওয়া যায়নি";
            if (address === "N/A" || address.trim() === "") {
                const ocResponse = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${uwData.lat}+${uwData.lon}&key=${OPENCAGE_API_KEY}&language=bn`);
                if (!ocResponse.ok) throw new Error(`OpenCage API error: ${ocResponse.statusText}`);
                const ocData = await ocResponse.json();
                address = ocData.results[0]?.formatted || "ঠিকানা পাওয়া যায়নি";
            }

            setResultHtml(`<h3>ফলাফল:</h3><p>📍 <strong>ঠিকানা:</strong> ${address}</p><p>📡 <strong>সেল তথ্য:</strong> MCC-${mcc}, MNC-${mnc}, LAC-${lac}, Cell-${cellId}</p><p>🌐 <strong>কোঅর্ডিনেট:</strong> ${uwData.lat.toFixed(5)}, ${uwData.lon.toFixed(5)}</p>`);
            const loc = { lat: uwData.lat, lng: uwData.lon };
            setCurrentLocation(loc);
            setMapMarkers([{ id: 'cellTower', position: loc, title: `সেল টাওয়ার: LAC-${lac}, CID-${cellId}`, icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' } }]);
            setMapCenter(loc);
            setMapZoom(15);
            setIsMapVisible(true);
            updateHistory(params);
            updateUrlParameters(mcc, mnc, lac, cellId);
            setIsActionButtonsDisabled(false);
        } catch (error: any) {
            setResultHtml(`<p style="color: red;"><strong>ত্রুটি:</strong> ${error.message}</p>`);
            setCurrentLocation(null);
        } finally {
            setIsLoading(false);
        }
    }, [formState, updateHistory]);
    
    useEffect(() => {
        const history = localStorage.getItem('towerSearchHistory');
        if (history) setSearchHistory(JSON.parse(history));
        
        const params = new URLSearchParams(window.location.search);
        if(params.has('mcc') && params.has('mnc') && params.has('lac') && params.has('cellId')) {
            const searchData = { mcc: params.get('mcc')!, mnc: params.get('mnc')!, lac: params.get('lac')!, cellId: params.get('cellId')! };
            setFormState(searchData);
            findLocation(searchData);
        }
    }, []); // Removed findLocation from dependency array to only run on mount

    const resetFormAndMap = () => {
        setFormState({ mcc: '470', mnc: '', lac: '', cellId: '' });
        setDistanceTarget({ lat: '', lon: '' });
        setResultHtml(null);
        setDistanceResultHtml(null);
        setCurrentLocation(null);
        setIsMapVisible(false);
        setMapMarkers([]);
        setMapPaths([]);
        setIsActionButtonsDisabled(true);
        // window.history.replaceState({}, '', window.location.pathname);
    };
    
    const copyShareLink = () => {
        if (!currentLocation) { alert("প্রথমে একটি লোকেশন খুঁজুন।"); return; }
        const params = new URLSearchParams({ mcc: formState.mcc, mnc: formState.mnc, lac: formState.lac, cellId: formState.cellId });
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        navigator.clipboard.writeText(shareUrl).then(() => alert('এই অ্যাপের লিংকটি ক্লিপবোর্ডে কপি হয়েছে!'));
    };

    const shareLocation = async () => {
        if (!currentLocation) { alert("প্রথমে একটি লোকেশন খুঁজুন।"); return; }
        const shareData = {
            title: 'সেল টাওয়ার লোকেশন',
            text: `সেল টাওয়ার তথ্য:\nMCC: ${formState.mcc}, MNC: ${formState.mnc}, LAC: ${formState.lac}, CellID: ${formState.cellId}`,
            url: `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.error('শেয়ার করতে সমস্যা:', err); }
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => alert('ব্রাউজার সরাসরি শেয়ার সমর্থন করে না। গুগল ম্যাপস লিংক ক্লিপবোর্ডে কপি করা হয়েছে।'));
        }
    };

    const calculateDistance = () => {
        if (!window.google || !currentLocation) { alert("প্রথমে টাওয়ারের লোকেশন খুঁজুন।"); return; }
        const targetLat = parseFloat(distanceTarget.lat.replace(',', '.').trim());
        const targetLon = parseFloat(distanceTarget.lon.replace(',', '.').trim());
        if (isNaN(targetLat) || isNaN(targetLon)) { alert("সঠিক লক্ষ্য অক্ষাংশ/দ্রাঘিমাংশ দিন।"); return; }

        const towerPos = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
        const targetPos = new window.google.maps.LatLng(targetLat, targetLon);
        const distanceInKm = window.google.maps.geometry.spherical.computeDistanceBetween(towerPos, targetPos) / 1000;
        
        setDistanceResultHtml(`<p>দূরত্ব: <strong>${distanceInKm.toFixed(2)} কিমি</strong></p>`);
        setMapPaths([{ id: 'distanceLine', coordinates: [towerPos.toJSON(), targetPos.toJSON()], strokeColor: '#FF0000', strokeWeight: 3 }]);
    };
    
    const showMyLocation = () => {
        if (!navigator.geolocation) { alert('আপনার ব্রাউজার জিওলোকেশন সাপোর্ট করে না।'); return; }
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(position => {
            const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
            setMapMarkers(prev => [...prev.filter(m => m.id !== 'userLocation'), { id: 'userLocation', position: userPos, title: 'আপনার বর্তমান অবস্থান', icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}]);
            setMapCenter(userPos);
            setMapZoom(15);
            setIsMapVisible(true);
            setIsLoading(false);
        }, () => { setIsLoading(false); alert('আপনার লোকেশন পেতে সমস্যা হচ্ছে।'); });
    };

    const exportToKML = () => {
        if (!currentLocation || !resultHtml) { alert("প্রথমে লোকেশন খুঁজুন।"); return; }
        const resultText = resultHtml.replace(/<[^>]*>?/gm, '\n').replace(/\n\n/g, '\n').trim();
        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Placemark><name>সেল লোকেশন: LAC-${formState.lac}, CID-${formState.cellId}</name><description><![CDATA[${resultText.replace(/(\r\n|\n|\r)/gm, "<br>")}]]></description><Point><coordinates>${currentLocation.lng},${currentLocation.lat},0</coordinates></Point></Placemark></kml>`;
        const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `CellLocation_${formState.lac}_${formState.cellId}.kml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={cn("p-4 sm:p-6 bg-surface text-textPrimary", mapStyle === 'dark' && 'dark bg-neutral-darkest text-neutral-lightest')}>
            <style>{` @keyframes scroll-text { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .animate-scroll-text { display: inline-block; padding-left: 100%; animation: scroll-text 20s linear infinite; } `}</style>
            <div className="bg-emerald-500 text-white p-3 rounded-md mb-5 overflow-hidden whitespace-nowrap"><p className="animate-scroll-text font-semibold">এই অ্যাপের প্রো ভার্সন অথবা মোবাইল এ্যাপ পেতে হলে যোগাযোগ করুন- 01794430399 (হোয়াটসএ্যাপ)।</p></div>
            <h1 className="text-2xl font-bold mb-4">সেল টাওয়ার লোকেশন ট্র্যাকার</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="number" name="mcc" value={formState.mcc} onChange={handleInputChange} placeholder="MCC (উদা: 470)" className="w-full p-2 border rounded bg-inherit"/>
                <input type="number" name="mnc" value={formState.mnc} onChange={handleInputChange} placeholder="MNC (উদা: 01)" className="w-full p-2 border rounded bg-inherit"/>
                <input type="number" name="lac" value={formState.lac} onChange={handleInputChange} placeholder="LAC" className="w-full p-2 border rounded bg-inherit"/>
                <input type="number" name="cellId" value={formState.cellId} onChange={handleInputChange} placeholder="Cell ID" className="w-full p-2 border rounded bg-inherit"/>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => findLocation()} disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400 flex items-center">{isLoading ? <Loader2 className="animate-spin mr-2"/> : null} লোকেশন খুঁজুন</button>
                <button onClick={resetFormAndMap} className="px-4 py-2 bg-neutral-500 text-white rounded hover:bg-neutral-600">ফর্ম রিসেট করুন</button>
                <button onClick={copyShareLink} disabled={isActionButtonsDisabled} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">লিংক কপি</button>
                <button onClick={shareLocation} disabled={isActionButtonsDisabled} className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-400">লোকেশন শেয়ার করুন</button>
                <button onClick={() => setIsDistanceSectionVisible(v => !v)} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">দূরত্ব মাপুন</button>
                <button onClick={showMyLocation} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">আমার লোকেশন</button>
                <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value as any)} disabled={isActionButtonsDisabled} className="p-2 border rounded bg-inherit disabled:bg-gray-200 dark:disabled:bg-gray-700">
                    <option value="streets">স্ট্রিট ভিউ</option> <option value="satellite">স্যাটেলাইট</option> <option value="dark">ডার্ক মোড</option>
                </select>
                <button onClick={exportToKML} disabled={isActionButtonsDisabled} className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 disabled:bg-gray-400">KML এক্সপোর্ট</button>
            </div>
            {isDistanceSectionVisible && <div className="p-4 border rounded my-4 space-y-3"><h3 className="font-semibold">দূরত্ব পরিমাপ করুন</h3>
                <input type="text" name="lat" value={distanceTarget.lat} onChange={handleDistanceInputChange} placeholder="লক্ষ্য অক্ষাংশ" className="w-full p-2 border rounded bg-inherit"/>
                <input type="text" name="lon" value={distanceTarget.lon} onChange={handleDistanceInputChange} placeholder="লক্ষ্য দ্রাঘিমাংশ" className="w-full p-2 border rounded bg-inherit"/>
                <button onClick={calculateDistance} className="px-4 py-2 bg-emerald-600 text-white rounded">দূরত্ব নির্ণয়</button>
                {distanceResultHtml && <div dangerouslySetInnerHTML={{ __html: distanceResultHtml }} />}
            </div>}
            {resultHtml && <div dangerouslySetInnerHTML={{ __html: resultHtml }} className="p-4 border rounded bg-neutral-lightest dark:bg-neutral-darker mb-4"/>}
            <div className={cn("h-96 w-full rounded-lg my-4", !isMapVisible && "hidden")}>
                 <GoogleMapView center={mapCenter} zoom={mapZoom} markers={mapMarkers} paths={mapPaths} mapTypeId={mapStyle === 'satellite' ? 'hybrid' : 'roadmap'} styles={mapStyle === 'dark' ? DARK_MAP_STYLE : undefined}/>
            </div>
            <div className="mt-6">
                <h3 className="text-lg font-semibold">সর্বশেষ সার্চগুলি</h3>
                <div className="space-y-2 mt-2">{searchHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-neutral-lightest dark:bg-neutral-darker rounded cursor-pointer hover:bg-neutral-light dark:hover:bg-neutral-dark" onClick={() => { setFormState(item); findLocation(item); }}>
                        <div><p>{item.mcc}/{item.mnc}/{item.lac}/{item.cellId}</p><small className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.timestamp).toLocaleString()}</small></div>
                        <button onClick={(e) => { e.stopPropagation(); const newHistory = searchHistory.filter((_, i) => i !== index); setSearchHistory(newHistory); localStorage.setItem('towerSearchHistory', JSON.stringify(newHistory)); }} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">মুছুন</button>
                    </div>))}
                </div>
            </div>
        </div>
    );
};
export default CellTowerLocatorView;