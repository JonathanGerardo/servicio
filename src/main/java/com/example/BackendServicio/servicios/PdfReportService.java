package com.example.BackendServicio.servicios;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

import org.knowm.xchart.BitmapEncoder;
import org.knowm.xchart.XYChart;
import org.knowm.xchart.XYChartBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.BackendServicio.entidades.DeviceEntity;
import com.example.BackendServicio.entidades.DeviceReadingEntity;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfReportService {

    private static final Logger log = LoggerFactory.getLogger(PdfReportService.class);

    public byte[] generateDeviceReport(DeviceEntity device, List<DeviceReadingEntity> readings) {
        try {
            List<DeviceReadingEntity> orderedReadings = new ArrayList<>(readings);
            Collections.reverse(orderedReadings);

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            Document document = new Document();
            PdfWriter.getInstance(document, output);

            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font subtitleFont = new Font(Font.HELVETICA, 12, Font.NORMAL);

            document.add(new Paragraph("Reporte energético del dispositivo", titleFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Dispositivo: " + safe(device.getDeviceName()), subtitleFont));
            document.add(new Paragraph("UID: " + safe(device.getDeviceUid()), subtitleFont));
            document.add(new Paragraph("BLE: " + safe(device.getBleName()), subtitleFont));
            document.add(new Paragraph("Ubicación: " + safe(device.getUbicacion()), subtitleFont));
            document.add(new Paragraph("Etiqueta: " + safe(device.getEtiqueta()), subtitleFont));
            document.add(new Paragraph("Total de lecturas: " + orderedReadings.size(), subtitleFont));
            document.add(new Paragraph(" "));

            if (orderedReadings.isEmpty()) {
                document.add(new Paragraph("No hay lecturas registradas para este dispositivo."));
            } else {
                addChart(document, "Voltaje promedio", orderedReadings, "V", "voltage");
                addChart(document, "Corriente promedio", orderedReadings, "A", "current");
                addChart(document, "Potencia promedio", orderedReadings, "W", "power");
                addChart(document, "Energía acumulada", orderedReadings, "kWh", "energy");
            }

            document.close();

            return output.toByteArray();
        } catch (Exception e) {
            log.error("Error real al generar el PDF del reporte", e);
            throw new RuntimeException("No se pudo generar el PDF del reporte: " + e.getMessage(), e);
        }
    }

    private void addChart(
        Document document,
        String title,
        List<DeviceReadingEntity> readings,
        String unit,
        String type
    ) throws Exception {
        List<Integer> xData = IntStream.rangeClosed(1, readings.size())
            .boxed()
            .toList();

        List<Double> yData = readings.stream()
            .map(reading -> getValue(reading, type))
            .toList();

        XYChart chart = new XYChartBuilder()
            .width(700)
            .height(360)
            .title(title)
            .xAxisTitle("Lectura")
            .yAxisTitle(unit)
            .build();

        chart.addSeries(title, xData, yData);

        byte[] chartBytes = BitmapEncoder.getBitmapBytes(
            chart,
            BitmapEncoder.BitmapFormat.PNG
        );

        Image image = Image.getInstance(chartBytes);
        image.scaleToFit(500, 260);

        document.add(new Paragraph(title));
        document.add(image);
        document.add(new Paragraph(" "));
    }

    private Double getValue(DeviceReadingEntity reading, String type) {
        Double value = switch (type) {
            case "voltage" -> reading.getVoltageAvg();
            case "current" -> reading.getCurrentAvg();
            case "power" -> reading.getPowerAvg();
            case "energy" -> reading.getEnergyKwh();
            default -> 0.0;
        };

        return value == null ? 0.0 : value;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}