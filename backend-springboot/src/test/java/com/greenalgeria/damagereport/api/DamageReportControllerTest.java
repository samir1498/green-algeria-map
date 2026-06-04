package com.greenalgeria.damagereport.api;

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
class DamageReportControllerTest extends IntegrationTest {

    private String createZone() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test Zone","type":"planting","lat":36.0,"lng":3.0,"description":"For reports"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    void create_returns201() throws Exception {
        var zoneId = createZone();

        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"vandalism","severity":"high","lat":36.5,"lng":3.0,"description":"Broken fence","reportedBy":"Samir"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.type").value("vandalism"));
    }

    @Test
    void create_rejectsMissingFields() throws Exception {
        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"not-a-uuid"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_returns200() throws Exception {
        var zoneId = createZone();
        var body = mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"fire","severity":"critical","lat":1.0,"lng":2.0,"description":"Fire","reportedBy":"Samir"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id)
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"verified"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("verified"));
    }

    @Test
    void updateStatus_returns404() throws Exception {
        var id = UUID.randomUUID();

        var userId = signUpAndGetUserId();

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id)
                        .with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"resolved"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204() throws Exception {
        var zoneId = createZone();
        var body = mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"disease","severity":"low","lat":36.0,"lng":3.0,"description":"Sick tree","reportedBy":"botanist@test.com"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/damage-reports/{id}", id).with(user(userId)))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404() throws Exception {
        var id = UUID.randomUUID();

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/damage-reports/{id}", id).with(user(userId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStatus_returns401_whenUnauthenticated() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"verified"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_returns401_whenUnauthenticated() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(delete("/api/damage-reports/{id}", id)).andExpect(status().isUnauthorized());
    }
}
