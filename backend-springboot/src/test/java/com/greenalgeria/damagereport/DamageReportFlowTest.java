package com.greenalgeria.damagereport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.shared.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class DamageReportFlowTest extends IntegrationTest {

    private String createZone() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Report Zone","type":"planting","lat":36.0,"lng":3.0,"description":"For reports"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    void createAndGetById() throws Exception {
        var zoneId = createZone();

        var body = mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"fire","severity":"high","lat":36.0,"lng":3.0,"description":"Fire near the road","reportedBy":"ranger@test.com"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.type").value("fire"))
                .andExpect(jsonPath("$.severity").value("high"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/damage-reports/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Fire near the road"))
                .andExpect(jsonPath("$.status").value("reported"));
    }

    @Test
    void createAndUpdateStatus() throws Exception {
        var zoneId = createZone();
        var body = mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"vandalism","severity":"medium","lat":36.0,"lng":3.0,"description":"Broken fence","reportedBy":"guard@test.com"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id).with(user(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"verified"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("verified"));
    }

    @Test
    void createAndDelete() throws Exception {
        var zoneId = createZone();
        var body = mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"disease","severity":"low","lat":36.0,"lng":3.0,"description":"Tree disease","reportedBy":"botanist@test.com"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/damage-reports/{id}", id).with(user(userId))).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/damage-reports/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void findByZoneId() throws Exception {
        var zoneA = createZone();
        var zoneB = createZone();

        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"fire","severity":"high","lat":36.0,"lng":3.0,"description":"Report for zone A","reportedBy":"a@test.com"}
                                """.formatted(zoneA)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"drought","severity":"low","lat":35.0,"lng":2.0,"description":"Report for zone B","reportedBy":"b@test.com"}
                                """.formatted(zoneB)))
                .andExpect(status().isCreated());

        var body = mockMvc.perform(get("/api/damage-reports?zoneId={zoneId}", zoneA))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(JsonPath.<Integer>read(body, "$.length()")).isEqualTo(1);
        assertThat((String) JsonPath.read(body, "$[0].description")).contains("zone A");
    }

    @Test
    void rejectsInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Missing required fields"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
