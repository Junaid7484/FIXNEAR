function Button({
    children,
    type = "button",
    onClick,
    disabled = false,
    variant = "primary",
    className = "",
}) {

    const variants = {
        primary:
            "bg-blue-600 hover:bg-blue-700 text-white",

        secondary:
            "bg-slate-100 hover:bg-slate-200 text-slate-800",

        danger:
            "bg-red-600 hover:bg-red-700 text-white",

        outline:
            "border border-slate-300 hover:bg-slate-50 text-slate-800",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
                ${variants[variant]}
                ${className}
            `}
        >
            {children}
        </button>
    );
}

export default Button;