import { RefreshCw, Download, X, WifiOff, Wifi, AlertTriangle } from 'lucide-react'

/**
 * AppUpdateBanner — Sleek bottom banner when a new version is available
 */
export function AppUpdateBanner({ onUpdate, onDismiss }) {
    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] animate-slideUp">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/25 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Update Available</p>
                    <p className="text-xs text-white/70">Tap to get the latest version</p>
                </div>
                <button
                    onClick={onUpdate}
                    className="px-4 py-2 bg-white text-indigo-600 font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors flex-shrink-0"
                >
                    Update
                </button>
                <button
                    onClick={onDismiss}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

/**
 * NetworkStatusBanner — Shows offline/slow-connection/reconnected banners
 */
export function NetworkStatusBanner({ isOnline, wasOffline, isSlowConnection }) {
    if (!isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[200] animate-slideDown">
                <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span>No internet connection</span>
                    <span className="text-gray-400 text-xs">• Using cached data</span>
                </div>
            </div>
        )
    }

    if (wasOffline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[200] animate-slideDown">
                <div className="bg-emerald-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
                    <Wifi className="w-4 h-4" />
                    <span>Back online</span>
                </div>
            </div>
        )
    }

    if (isSlowConnection) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[200] animate-slideDown">
                <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Slow connection detected</span>
                </div>
            </div>
        )
    }

    return null
}

/**
 * PullToRefreshIndicator — Spinner that shows during pull-to-refresh
 */
export function PullToRefreshIndicator({ pullProgress, isRefreshing, showIndicator }) {
    if (!showIndicator && !isRefreshing) return null

    const translateY = isRefreshing ? 60 : Math.min(pullProgress * 70, 70)
    const scale = isRefreshing ? 1 : Math.min(pullProgress, 1)
    const rotation = isRefreshing ? 'animate-spin' : ''
    const opacity = Math.min(pullProgress * 1.5, 1)

    return (
        <div
            className="fixed top-0 left-0 right-0 flex justify-center z-[150] pointer-events-none"
            style={{ transform: `translateY(${translateY}px)` }}
        >
            <div
                className={`w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-transform ${rotation}`}
                style={{ transform: `scale(${scale})`, opacity }}
            >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-indigo-500' : pullProgress >= 1 ? 'text-indigo-500' : 'text-gray-400'}`} />
            </div>
        </div>
    )
}

export default AppUpdateBanner
