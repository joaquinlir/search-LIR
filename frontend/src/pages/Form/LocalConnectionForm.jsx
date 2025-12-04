// src/components/LocalConnectionForm.jsx
import React, { useEffect, useState } from "react";
import "./styles/LocalConnectionForm.css"; // Asegúrate de crear este archivo CSS

const LOCAL_STORAGE_KEY = "lm_saved_firms";

const LocalConnectionForm = () => {
    const [savedFirms, setSavedFirms] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        role: "",
        country: "",
        region: "", // Campo específico para Local Connection
        contactPreference: "email",
        topics: [], // multi-select
        newsletter: false,
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

        // Checkbox simple
        if (type === "checkbox" && name === "newsletter") {
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        // Radio
        if (type === "radio" && name === "contactPreference") {
            setFormData((prev) => ({ ...prev, [name]: value }));
            return;
        }

        // Inputs normales
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Multi-select de temas
    const handleTopicsChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map(
            (opt) => opt.value
        );
        setFormData((prev) => ({ ...prev, topics: selected }));
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
                topics: formData.topics.join(", "),
                savedFirmsCount: savedCount,
                savedFirmNames,
                savedFirmCountries,
                timestamp: new Date().toISOString(),
                formType: "Local Connection", // Campo para identificar el tipo de formulario
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
                region: "",
                contactPreference: "email",
                topics: [],
                newsletter: false,
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
                    <h1>Formulario de Local Connection</h1>
                    <p className="form-subtitle">
                        Acceda a firmas legales calificadas en su misma zona de operación. Cuéntanos tus necesidades específicas.
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

                        {/* Campo específico para Local Connection */}
                        <div className="form-field">
                            <label htmlFor="region">Región / Área de Operación</label>
                            <input
                                id="region"
                                name="region"
                                type="text"
                                placeholder="Santiago, Lima, Bogotá..."
                                value={formData.region}
                                onChange={handleChange}
                            />
                        </div>
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

                    {/* Temas de interés (multi-select) */}
                    <div className="form-section">
                        <p className="form-section-title">
                            ¿En qué áreas de práctica estás más interesado/a?
                        </p>

                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="topics">Selecciona uno o varios temas</label>
                                <select
                                    id="topics"
                                    name="topics"
                                    multiple
                                    value={formData.topics}
                                    onChange={handleTopicsChange}
                                >
                                    <option value="m&a">M&amp;A</option>
                                    <option value="energy">Energía / Recursos naturales</option>
                                    <option value="litigation">Litigios / Arbitraje</option>
                                    <option value="tax">Tributario</option>
                                    <option value="labor">Laboral</option>
                                    <option value="banking">Banca y finanzas</option>
                                    <option value="compliance">Compliance / White collar</option>
                                    <option value="tech">Tecnología / Data / TMT</option>
                                    <option value="real-estate">Bienes raíces</option>
                                    <option value="regulatory">Regulatorio</option>
                                </select>
                                <p className="form-hint">
                                    Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar
                                    varias opciones.
                                </p>
                            </div>

                            <div className="form-field">
                                <label>¿Qué te gustaría que prioricemos?</label>
                                <div className="form-checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="newsletter"
                                            checked={formData.newsletter}
                                            onChange={handleChange}
                                        />
                                        Recibir actualizaciones sobre el Market Monitor
                                    </label>
                                </div>
                            </div>
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
                            placeholder="Cuéntanos si tienes necesidades específicas, áreas prioritarias, plazos, etc."
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
                            ¡Gracias! Tu información para Local Connection se envió correctamente.
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

export default LocalConnectionForm;