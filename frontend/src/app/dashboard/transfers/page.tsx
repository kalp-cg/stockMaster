'use client';

export default function TransfersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Transfers</h1>
                <p className="text-gray-600">Move stock between locations</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Stock Transfers</h3>
                    <p className="text-gray-600">Transfer inventory between warehouse locations. This feature is coming soon.</p>
                </div>
            </div>
        </div>
    );
}
