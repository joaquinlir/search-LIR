// src/components/FeeBenchmarkingForm.jsx
import React, { useEffect, useState } from "react";
import "./styles/FeeBenchmarkingForm.css"; // Asegúrate de crear este archivo CSS

const LOCAL_STORAGE_KEY = "lm_saved_firms";

const FeeBenchmarkingForm = () => {
    const [savedFirms, setSavedFirms] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        role: "",
        country: "",
        contactPreference: "email",
        benchmarkingType: "", // Nuevo campo
        currentFirm: "", // Nuevo campo
        comments: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // 🔹 Leer firmas guardadas desde localStorage
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            setSavedFirms(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            console.error("Error leyendo lm_saved_firms desde localStorage", e);
            setSavedFirms([]);
        }
    }, []);

    const savedCount = savedFirms.length;

    // 🧩 Helpers para armar texto de firmas / países
    const savedFirmNames = savedFirms.map((f) => f.firm).join(" | ");

    const savedFirmCountries = Array.from(
        new Set(
            savedFirms
                .map((f) => f.country || "")
                .map((c) => c.trim())
                .filter(Boolean)
        )
    ).join(" | ");

    // 🔹 Manejadores de cambio
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Radio
        if (type === "radio" && name === "contactPreference") {
            setFormData((prev) => ({ ...prev, [name]: value }));
            return;
        }

        // Inputs normales
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 🔹 Envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        // Validación mínima
        if (!formData.email.trim()) {
            setSubmitError("Por favor ingresa un correo electrónico.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                savedFirmsCount: savedCount,
                savedFirmNames,
                savedFirmCountries,
                timestamp: new Date().toISOString(),
                formType: "Fee Benchmarking", // Campo para identificar el tipo de formulario
            };

            const res = await fetch("/api/form-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Error al enviar el formulario.");
            }

            setSubmitSuccess(true);
            setFormData((prev) => ({
                ...prev,
                name: "",
                email: "",
                company: "",
                role: "",
                country: "",
                contactPreference: "email",
                benchmarkingType: "",
                currentFirm: "",
                comments: "",
            }));
        } catch (err) {
            console.error(err);
            setSubmitError("Hubo un problema al enviar tus respuestas. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-page">
            <div className="form-card">
                <header className="form-header">
                    <h1>Formulario de Fee Benchmarking</h1>
                    <p className="form-subtitle">
                        Evalúa si los honorarios legales que pagas actualmente se alinean con los estándares del mercado.
                    </p>

                    <p className="form-saved-counter">
                        Firmas guardadas:{" "}
                        <strong>{savedCount}</strong>
                    </p>

                    {savedCount > 0 && (
                        <div className="form-saved-preview">
                            <span className="form-saved-preview-label">
                                Ejemplo de firmas:
                            </span>
                            <span className="form-saved-preview-value">
                                {savedFirms
                                    .slice(0, 3)
                                    .map((f) => f.firm)
                                    .join(" · ")}
                                {savedCount > 3 && ` · +${savedCount - 3} más`}
                            </span>
                        </div>
                    )}
                </header>

                <form className="form-body" onSubmit={handleSubmit}>
                    {/* Datos básicos */}
                    <div className="form-grid">
                        <div className="form-field">
                            <label htmlFor="name">Nombre completo</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Tu nombre"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="email">
                                Correo electrónico <span className="required">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tucorreo@ejemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="company">Firma / Empresa</label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                placeholder="Nombre de la firma o empresa"
                                value={formData.company}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="role">Cargo</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="">Selecciona una opción</option>
                                <option value="socio">Socio / Partner</option>
                                <option value="asociado">Asociado</option>
                                <option value="gerencia-legal">Gerencia legal</option>
                                <option value="inhouse">Abogado in-house</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="country">País</label>
                            <input
                                id="country"
                                name="country"
                                type="text"
                                placeholder="Chile, México, España…"
                                value={formData.country}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Tipo de Benchmarking */}
                    <div className="form-section">
                        <p className="form-section-title">
                            ¿Qué tipo de benchmarking te interesa?
                        </p>
                        <div className="form-radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="benchmarkingType"
                                    value="ongoing-counsel"
                                    checked={formData.benchmarkingType === "ongoing-counsel"}
                                    onChange={handleChange}
                                />
                                Honorarios para asesoría continua
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="benchmarkingType"
                                    value="specific-matters"
                                    checked={formData.benchmarkingType === "specific-matters"}
                                    onChange={handleChange}
                                />
                                Honorarios para asuntos específicos
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="benchmarkingType"
                                    value="both"
                                    checked={formData.benchmarkingType === "both"}
                                    onChange={handleChange}
                                />
                                Ambos
                            </label>
                        </div>
                    </div>

                    {/* Firma actual */}
                    <div className="form-field">
                        <label htmlFor="currentFirm">
                            ¿Con qué firma legal trabajas actualmente?
                        </label>
                        <input
                            id="currentFirm"
                            name="currentFirm"
                            type="text"
                            placeholder="Nombre de la firma actual"
                            value={formData.currentFirm}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Preferencia de contacto */}
                    <div className="form-section">
                        <p className="form-section-title">
                            ¿Cómo prefieres que te contactemos?
                        </p>
                        <div className="form-radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="contactPreference"
                                    value="email"
                                    checked={formData.contactPreference === "email"}
                                    onChange={handleChange}
                                />
                                Correo electrónico
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="contactPreference"
                                    value="phone"
                                    checked={formData.contactPreference === "phone"}
                                    onChange={handleChange}
                                />
                                Teléfono / Videollamada
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="contactPreference"
                                    value="whatsapp"
                                    checked={formData.contactPreference === "whatsapp"}
                                    onChange={handleChange}
                                />
                                WhatsApp
                            </label>
                        </div>
                    </div>

                    {/* Comentarios adicionales */}
                    <div className="form-field">
                        <label htmlFor="comments">
                            Comentarios adicionales / contexto
                        </label>
                        <textarea
                            id="comments"
                            name="comments"
                            rows={4}
                            placeholder="¿Tienes alguna métrica específica en mente? ¿Qué aspectos te gustaría comparar?"
                            value={formData.comments}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Mensajes de estado */}
                    {submitError && (
                        <div className="form-alert form-alert-error">
                            {submitError}
                        </div>
                    )}
                    {submitSuccess && (
                        <div className="form-alert form-alert-success">
                            ¡Gracias! Tu información para Fee Benchmarking se envió correctamente.
                        </div>
                    )}

                    {/* Botón de envío */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="form-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Enviando..." : "Enviar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeBenchmarkingForm;