function Input({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder = "",
    required = false,
    error = "",
}) {

    return (
        <div className="w-full">

            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}

                    {required && (
                        <span className="text-red-500 ml-1">
                            *
                        </span>
                    )}
                </label>
            )}

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    ${
                        error
                            ? "border-red-500"
                            : "border-slate-200"
                    }
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
                    transition
                `}
            />

            {error && (
                <p className="text-sm text-red-500 mt-1">
                    {error}
                </p>
            )}

        </div>
    );
}

export default Input;