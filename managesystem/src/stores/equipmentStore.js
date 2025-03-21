import { defineStore } from 'pinia';
import { ref } from 'vue';
import service from '../utils/request';

export const useEquipmentStore = defineStore('equipment', () => {
    const equipment = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const fetchEquipment = async () => {
        try {
            isLoading.value = true;
            error.value = null;
            const response = await service.get("/admin/halls/equipments");
            equipment.value = response.data;
        } catch (err) {
            error.value = err;
            console.error('Error fetching equipment:', err);
        } finally {
            isLoading.value = false;
        }
    };

    const addEquipment = () => {

    };

    const deleteEquipment = () => {

    };

    const updateEquipment = () => {

    };

    return { equipment, isLoading, error, fetchEquipment };
},{
    persist: true,
});