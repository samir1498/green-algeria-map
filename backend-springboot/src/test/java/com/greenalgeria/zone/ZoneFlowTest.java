package com.greenalgeria.zone;

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
class ZoneFlowTest extends IntegrationTest {

    @Test
    void createAndGetById() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Flow Zone","type":"planting","lat":36.0,"lng":3.0,"description":"Flow test"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Flow Zone"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        var id = JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/zones/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Flow Zone"))
                .andExpect(jsonPath("$.lat").value(36.0));
    }

    @Test
    void getAllZones() throws Exception {
        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Zone A","type":"planting","lat":36.0,"lng":3.0,"description":"A"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Zone B","type":"trash","lat":35.0,"lng":2.0,"description":"B"}
                                """))
                .andExpect(status().isCreated());

        var body = mockMvc.perform(get("/api/zones"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(JsonPath.<Integer>read(body, "$.length()")).isEqualTo(2);
    }

    @Test
    void createAndUpdate() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"To Update","type":"planting","lat":36.0,"lng":3.0,"description":"Before"}
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
                                {"name":"Updated","status":"in_progress"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.status").value("in_progress"));

        var body2 = mockMvc.perform(get("/api/zones/{id}", id))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(JsonPath.<String>read(body2, "$.status")).isEqualTo("in_progress");
    }

    @Test
    void createAndDelete() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"To Delete","type":"planting","lat":36.0,"lng":3.0,"description":"Gone"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        var userId = signUpAndGetUserId();

        mockMvc.perform(delete("/api/zones/{id}", id).with(user(userId))).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/zones/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void createAndRegisterVolunteer() throws Exception {
        var body = mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Volunteer Zone","type":"planting","lat":36.0,"lng":3.0,"description":"Help"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        var id = JsonPath.read(body, "$.id");

        mockMvc.perform(post("/api/zones/{id}/volunteer", id)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/zones/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.volunteerCount").value(1));
    }

    @Test
    void rejectsInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":""}
                                """))
                .andExpect(status().isBadRequest());
    }
}
