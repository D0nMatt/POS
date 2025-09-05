import React, { useState, useEffect } from 'react';
import api from '../api';
import EmployeeModal from '../components/EmployeeModal';

function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/employees');
                setEmployees(res.data);
            } catch (error) {
                console.error('Error al obtener los empleados:', error);
                alert('No se pudieron cargar los empleados.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleCreate = () => {
        setEditingEmployee(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };

    const handleDelete = async (employeeId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar a este empleado?')) {
            try {
                await api.delete(`/employees/${employeeId}`);
                setEmployees(employees.filter((e) => e.id !== employeeId));
            } catch (error) {
                alert(error.response?.data?.msg || 'No se pudo eliminar el empleado.');
            }
        }
    };

    //Función para añadir el nuevo empleado a la lista
    const handleEmployeeCreated = (newEmployee) => {
        setEmployees([newEmployee, ...employees]);
    };

    const handleEmployeeUpdated = (updatedEmployee) => {
        setEmployees(
            employees.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e))
        );
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
    };

    return (
        <div>
            <h2>Gestión de Empleados</h2>
            <button onClick={handleCreate}>Crear Nuevo Empleado</button>

            {isModalOpen && (
                <EmployeeModal
                    employeeToEdit={editingEmployee}
                    onClose={closeModal}
                    onEmployeeCreated={handleEmployeeCreated}
                    onEmployeeUpdated={handleEmployeeUpdated}
                />
            )}

            {loading ? (<p>Cargando...</p>) : (
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Fecha de Creación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.id}>
                                <td>{employee.name}</td>
                                <td>{employee.email}</td>
                                <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => handleEdit(employee)}>Editar</button>
                                    <button onClick={() => handleDelete(employee.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
export default EmployeesPage;