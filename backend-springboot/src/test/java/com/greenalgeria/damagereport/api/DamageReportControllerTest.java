package com.greenalgeria.damagereport.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.damagereport.application.DamageReportResponse;
import com.greenalgeria.damagereport.application.DamageReportService;
import com.greenalgeria.damagereport.domain.DamageReportSeverity;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import com.greenalgeria.damagereport.domain.DamageReportType;
import java.time.OffsetDateTime;
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
@WebMvcTest(DamageReportController.class)
class DamageReportControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    DamageReportService damageReportService;

    @Test
    void create_returns201() throws Exception {
        var id = UUID.randomUUID();
        var zoneId = UUID.randomUUID();
        var response = new DamageReportResponse(
                id,
                zoneId,
                DamageReportType.vandalism,
                DamageReportSeverity.high,
                DamageReportStatus.reported,
                36.5,
                3.0,
                "Broken fence",
                "Samir",
                OffsetDateTime.now(),
                OffsetDateTime.now());
        when(damageReportService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/damage-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"zoneId":"%s","type":"vandalism","severity":"high","lat":36.5,"lng":3.0,"description":"Broken fence","reportedBy":"Samir"}
                                """.formatted(zoneId)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/damage-reports/" + id))
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
        var id = UUID.randomUUID();
        var zoneId = UUID.randomUUID();
        var response = new DamageReportResponse(
                id,
                zoneId,
                DamageReportType.fire,
                DamageReportSeverity.critical,
                DamageReportStatus.verified,
                1.0,
                2.0,
                "Fire",
                "Samir",
                OffsetDateTime.now(),
                OffsetDateTime.now());
        when(damageReportService.updateStatus(any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id)
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
        when(damageReportService.updateStatus(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

        mockMvc.perform(patch("/api/damage-reports/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"resolved"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/damage-reports/{id}", UUID.randomUUID())).andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404() throws Exception {
        var id = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(damageReportService)
                .delete(id);

        mockMvc.perform(delete("/api/damage-reports/{id}", id)).andExpect(status().isNotFound());
    }
}
