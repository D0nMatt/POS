import React, { useState, useEffect } from 'react';
import api from '../api';

function EmployeeModal({ employeeToEdit, onClose, onEmployeeCreated, onEmployeeUpdated }) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const isEditMode = !!employeeToEdit;

    useEffect(() => {
        if (isEditMode) {
            setFormData({ name: employeeToEdit.name, email: employeeToEdit.email, password: '' });
        }
    }, [employeeToEdit, isEditMode]);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                // En modo edición, no enviamos la contraseña
                const { name, email } = formData;
                const res = await api.put(`/employees/${employeeToEdit.id}`, { name, email });
                onEmployeeUpdated(res.data);
            } else {
                // En modo creación, la contraseña es requerida
                if (formData.password.length < 6) {
                    alert('La contraseña debe tener al menos 6 caracteres.');
                    return;
                }
                const res = await api.post('/employees', formData);
                onEmployeeCreated(res.data);
            }
            onClose();
        } catch (error) {
            alert(error.response?.data?.msg || 'No se pudo guardar el empleado.');
        }
    };

    const modalStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    };
    const contentStyle = { background: 'white', padding: '2rem', borderRadius: '5px' };

    return (
        <div style={modalStyle} onClick={onClose}>
            <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
                <h2>{isEditMode ? 'Editar Empleado' : 'Crear Nuevo Empleado'}</h2>
                <form onSubmit={onSubmit}>
                    <input name="name" value={formData.name} onChange={onChange} placeholder="Nombre completo" required />
                    <input name="email" type="email" value={formData.email} onChange={onChange} placeholder="Correo Electrónico" required />
                    {!isEditMode && (
                        <input name="password" type="password" value={formData.password} onChange={onChange} placeholder="Contraseña (mín. 6 caracteres)" required />
                    )}
                    <br />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={onClose}>Cancelar</button>
                </form>
            </div>
        </div>
    );
}

export default EmployeeModal;