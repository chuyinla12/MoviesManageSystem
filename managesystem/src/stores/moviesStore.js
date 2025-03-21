import { defineStore } from 'pinia'
import { ref } from 'vue'
import service from '../utils/request'

export const useMoviesStore = defineStore('movies', () => {
  const movies = ref([])
  const isLoading = ref(false);
  const error = ref(null);

  const fetchMovies = async (date) => {
      try {
          isLoading.value = true;
          error.value = null;
          const response = await service.get("/admin/movies", {
            params: {
              date: date
            }
          });
          movies.value = response.data;
      } catch (err) {
          error.value = err;
          console.error('Error fetching equipment:', err);
      } finally {
          isLoading.value = false;
      }
  };
  return { movies, isLoading, error, fetchMovies}
},{
    persist: true,
})