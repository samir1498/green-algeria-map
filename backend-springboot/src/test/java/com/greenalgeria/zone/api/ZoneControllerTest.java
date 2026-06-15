package com.greenalgeria.zone.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.shared.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class ZoneControllerTest extends IntegrationTest {

    @Test
    void create_returns201() throws Exception {
        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"New Zone","type":"planting","lat":36.5,"lng":3.0,"description":"desc","organizerContact":"contact"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("New Zone"));
    }

    @Test
    void create_rejectsMissingName() throws Exception {
        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"type":"planting","lat":36.5,"lng":3.0}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns200() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Old","type":"planting","lat":36.5,"lng":3.0,"description":"Before"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(patch("/api/zones/{id}", id)
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated","status":"in-progress","targetCount":10,"currentCount":5}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    void update_returns404() throws Exception {
        var id = UUID.randomUUID();

        var userId = signUpAndGetUserId();

        mockMvc.perform(patch("/api/zones/{id}", id)
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nope"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"To Delete","type":"planting","lat":36.5,"lng":3.0,"description":"Deleting"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/zones/{id}", id).with(user(userId))).andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404() throws Exception {
        var id = UUID.randomUUID();

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/zones/{id}", id).with(user(userId))).andExpect(status().isNotFound());
    }

    @Test
    void update_returns401_whenUnauthenticated() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(patch("/api/zones/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Hacker"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_returns401_whenUnauthenticated() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(delete("/api/zones/{id}", id)).andExpect(status().isUnauthorized());
    }

    @Test
    void registerVolunteer_returns204() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Volunteer","type":"planting","lat":36.5,"lng":3.0,"description":"Volunteering"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        mockMvc.perform(post("/api/zones/{id}/volunteer", id)).andExpect(status().isNoContent());
    }

    @Test
    void registerVolunteer_returns404() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(post("/api/zones/{id}/volunteer", id)).andExpect(status().isNotFound());
    }
}
