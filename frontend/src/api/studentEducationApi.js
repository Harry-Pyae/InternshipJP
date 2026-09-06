import { api } from "./axiosClient.js";

export const studentEducationApi = {
  list: () =>
    api
      .get("/api/students/me/education")
      .then((response) => response.data),

  add: (education) =>
    api
      .post("/api/students/me/education", education)
      .then((response) => response.data),

  update: (id, education) =>
    api
      .put(`/api/students/me/education/${id}`, education)
      .then((response) => response.data),

  remove: (id) =>
    api
      .delete(`/api/students/me/education/${id}`)
      .then((response) => response.data),
};
