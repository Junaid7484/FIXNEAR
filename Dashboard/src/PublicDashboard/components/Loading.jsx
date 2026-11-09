function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>

        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export default Loading;
