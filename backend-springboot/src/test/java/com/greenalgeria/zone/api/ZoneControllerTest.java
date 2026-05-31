package com.greenalgeria.zone.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.zone.application.ZoneResponse;
import com.greenalgeria.zone.application.ZoneService;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@Tag("unit")
@WebMvcTest(ZoneController.class)
class ZoneControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ZoneService zoneService;

    @Test
    void create_returns201() throws Exception {
        var zoneId = UUID.randomUUID();
        var response = new ZoneResponse(
                zoneId,
                "New Zone",
                ZoneType.planting,
                ZoneStatus.planned,
                36.5,
                3.0,
                null,
                null,
                "desc",
                List.of(),
                "contact",
                null,
                0);
        when(zoneService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"New Zone","type":"planting","lat":36.5,"lng":3.0,"description":"desc","organizerContact":"contact"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/zones/" + zoneId))
                .andExpect(jsonPath("$.id").value(zoneId.toString()));
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
        var zoneId = UUID.randomUUID();
        var response = new ZoneResponse(
                zoneId,
                "Updated",
                ZoneType.planting,
                ZoneStatus.in_progress,
                36.5,
                3.0,
                10,
                5,
                null,
                List.of(),
                null,
                null,
                0);
        when(zoneService.update(any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/zones/{id}", zoneId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated","status":"in_progress","targetCount":10,"currentCount":5}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    void update_returns404() throws Exception {
        var zoneId = UUID.randomUUID();
        when(zoneService.update(any(), any())).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(patch("/api/zones/{id}", zoneId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nope"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/zones/{id}", UUID.randomUUID())).andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404() throws Exception {
        var zoneId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(zoneService)
                .delete(zoneId);

        mockMvc.perform(delete("/api/zones/{id}", zoneId)).andExpect(status().isNotFound());
    }

    @Test
    void registerVolunteer_returns204() throws Exception {
        mockMvc.perform(post("/api/zones/{id}/volunteer", UUID.randomUUID())).andExpect(status().isNoContent());
    }

    @Test
    void registerVolunteer_returns404() throws Exception {
        var zoneId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(zoneService)
                .registerVolunteer(zoneId);

        mockMvc.perform(post("/api/zones/{id}/volunteer", zoneId)).andExpect(status().isNotFound());
    }
}
