import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useUserStore from '../../store/userStore';

const MedicalRecordList = () => {
    const [records, setRecords] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);
    const { user } = useUserStore();
    const [specialties, setSpecialties] = useState([]); // State for specialties
    const [services, setServices] = useState([]);

    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        diagnosis: '',
        treatment: '',
        record_date: '',
        address: '',
        phone: '',
        gender: '',
        birth_year: '',
        specialty: '',
        service: '',
        quantity: '',
        unit_price: '',
        total_price: '',
        prescription: ''
    });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchRecords();
        fetchDoctors();
        fetchPatients();
        fetchSpecialties(); // Fetch specialties

    }, []);

    const fetchSpecialties = async () => {
        try {
            const response = await axios.get('http://localhost:8080/specialties'); // Adjust the URL if necessary
            setSpecialties(response.data); // Populate state with API response
        } catch (error) {
            toast.error('Không thể lấy danh sách chuyên khoa');
        }
    };

    // Fetch services when specialty is selected
    const fetchServices = async (id) => {
        try {
            const response = await axios.get('http://localhost:8080/services', { params: { specialty_id: id } });
            setServices(response.data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    };

    const fetchRecords = async () => {
        try {
            const response = await axios.get('http://localhost:8080/medical-records');
            if (Array.isArray(response.data)) {
                setRecords(response.data);
            } else {
                setRecords([]);
                toast.error('Dữ liệu bệnh án không hợp lệ');
            }
        } catch (error) {
            toast.error('Không thể lấy dữ liệu bệnh án');
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/doctors`);
            setDoctors(response.data);
        } catch (error) {
            toast.error('Không thể lấy dữ liệu bác sĩ');
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:8080/patients');
            setPatients(response.data);
        } catch (error) {
            toast.error('Không thể lấy dữ liệu bệnh nhân');
        }
    };



    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            patient_id: record.patient_id,
            doctor_id: record.doctor_id,
            diagnosis: record.diagnosis,
            treatment: record.treatment,
            record_date: record.record_date
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8080/medical-records/${id}`);
            toast.success('Xóa bệnh án thành công');
            fetchRecords();
        } catch (error) {
            toast.error('Không thể xóa bệnh án');
        }
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;
        if (name === "specialty") {
            const id = specialties.filter(x => x.name === value)[0].id
            fetchServices(id)
        }
        // Cập nhật giá trị trường hiện tại
        setFormData({ ...formData, [name]: value });

        // Nếu thay đổi `patient_id`, gọi API lấy thông tin cuộc hẹn
        if (name === 'patient_id') {
            try {
                const response = await axios.get(`http://localhost:8080/appointments?benhNhanId=${formData.patient_id}&doctorId=${user.profile.id}`);
                if (response.data) {
                    // Điền thông tin từ cuộc hẹn vào form
                    setFormData({
                        ...formData,
                        patient_id: value, // Đảm bảo patient_id vẫn giữ giá trị mới
                        doctor_id: response.data[0].doctor_id || '',
                        diagnosis: response.data[0].diagnosis || '',
                        treatment: response.data[0].treatment || '',
                        record_date: response.data[0].record_date || '',
                        address: response.data[0].address || '',
                        phone: response.data[0].phone || '',
                        gender: response.data[0].gender || '',
                        birth_year: response.data[0].birth_year || '',
                        specialty: response.data[0].specialty || '',
                        service: response.data[0].service || '',
                        quantity: response.data[0].quantity || '',
                        unit_price: response.data[0].unit_price || '',
                        total_price: response.data[0].total_price || '',
                        prescription: response.data[0].prescription || '',
                    });
                } else {
                    toast.error('Không tìm thấy thông tin cuộc hẹn của bệnh nhân');
                }
            } catch (error) {
                toast.error('Không thể lấy dữ liệu cuộc hẹn của bệnh nhân');
            }
        }
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await axios.put(`http://localhost:8080/medical-records/${editingRecord.id}`, formData);
                toast.success('Cập nhật bệnh án thành công');
            } else {
                await axios.post('http://localhost:8080/medical-records', formData);
                toast.success('Thêm bệnh án thành công');
            }
            setEditingRecord(null);
            setFormData({
                patient_id: '',
                doctor_id: '',
                diagnosis: '',
                treatment: '',
                record_date: ''
            });
            setShowForm(false);
            fetchRecords();
        } catch (error) {
            toast.error('Không thể gửi biểu mẫu');
        }
    };

    return (
        <div>
            <h3>Quản lý Bệnh án </h3>
            <button className="btn btn-primary my-3" onClick={() => setShowForm(true)}>Thêm Bệnh án</button>
            {showForm && (
                <form onSubmit={handleSubmit}>
                    <label htmlFor="patient_id">Mã Bệnh nhân:</label>
                    <select
                        id="patient_id"
                        name="patient_id"
                        className="form-control"
                        value={formData.patient_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Chọn Bệnh nhân</option>
                        {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>{patient.fullname}</option>
                        ))}
                    </select>

                    <label htmlFor="doctor_id">Mã Bác sĩ:</label>
                    <input type="text" value={user.profile.fullname} />

                    <label htmlFor="diagnosis">Chẩn đoán:</label>
                    <textarea
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        required
                    ></textarea>

                    <label htmlFor="treatment">Điều trị:</label>
                    <textarea
                        id="treatment"
                        name="treatment"
                        value={formData.treatment}
                        onChange={handleChange}
                        required
                    ></textarea>

                    <label htmlFor="record_date">Ngày ghi nhận:</label>
                    <input
                        type="date"
                        id="record_date"
                        name="record_date"
                        value={formData.record_date}
                        onChange={handleChange}
                        required
                    />

                    {/* Thêm các trường mới */}
                    <label htmlFor="address">Địa chỉ:</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="phone">Số điện thoại:</label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="gender">Giới tính:</label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>

                    <label htmlFor="birth_year">Năm sinh:</label>
                    <input
                        type="number"
                        id="birth_year"
                        name="birth_year"
                        value={formData.birth_year || ''}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="specialty">Chuyên khoa:</label>
                    <select
                        id="specialty"
                        name="specialty"
                        value={formData.specialty || ''}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Chọn chuyên khoa</option>
                        {specialties.map(specialty => (
                            <option key={specialty.id} value={specialty.name}>{specialty.name}</option>
                        ))}
                    </select>


                    <label htmlFor="service">Dịch vụ:</label>
                    <select
                        id="service"
                        name="service"
                        value={formData.service || ''}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Chọn dịch vụ</option>
                        {/* Thêm danh sách dịch vụ */}
                        {services.map(service => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                    </select>

                    <label htmlFor="quantity">Số lượng:</label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity || ''}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="unit_price">Đơn giá:</label>
                    <input
                        type="number"
                        id="unit_price"
                        name="unit_price"
                        value={formData.unit_price || ''}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="total_price">Thành tiền:</label>
                    <input
                        type="number"
                        id="total_price"
                        name="total_price"
                        value={formData.total_price || ''}
                        onChange={handleChange}
                        readOnly
                    />

                    <label htmlFor="prescription">Đơn thuốc:</label>
                    <textarea
                        id="prescription"
                        name="prescription"
                        value={formData.prescription || ''}
                        onChange={handleChange}
                    ></textarea>

                    <div className="d-flex justify-content-center">
                        <button className="w-25 m-3" type="submit">{editingRecord ? 'Cập nhật' : 'Thêm'} Bệnh án</button>
                        <button className="w-25 m-3" type="button" onClick={() => setShowForm(false)}>Hủy</button>
                    </div>
                </form>
            )}
            <table className="table">
                <thead>
                    <tr>
                        <th>Tên Bệnh nhân</th>
                        <th>Tên Bác sĩ</th>
                        <th>Chẩn đoán</th>
                        <th>Điều trị</th>
                        <th>Ngày ghi nhận</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record.id}>
                            <td>{record.patient_name}</td>
                            <td>{record.doctor_name}</td>
                            <td>{record.diagnosis}</td>
                            <td>{record.treatment}</td>
                            <td>{new Date(record.record_date).toLocaleDateString()}</td>
                            <td>
                                <button className="btn-icon edit-icon m-2" onClick={() => handleEdit(record)} title="Sửa">
                                    <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                    className="btn-icon delete-icon"
                                    onClick={() => {
                                        if (window.confirm('Bạn có chắc chắn muốn xóa bệnh án này không?')) {
                                            handleDelete(record.id);
                                        }
                                    }}
                                    title="Xóa"
                                >
                                    <i className="bi bi-trash-fill"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MedicalRecordList;