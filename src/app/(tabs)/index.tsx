import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCivicStore } from '../../lib/store';
import { InteractiveMap } from '../../components/map/interactive-map';
import { MapFilterModal } from '../../components/map/map-filter-modal';
import { ReportDetailModal } from '../../components/reports/report-detail-modal';
import { Report } from '../../types';

export default function HomeScreen() {
  const { reports, filters } = useCivicStore();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Apply Store Filters to Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(r.category)) {
        return false;
      }
      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) {
        return false;
      }
      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(r.priority_level)) {
        return false;
      }
      // Search query
      if (filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase();
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchAddress = r.address.toLowerCase().includes(q);
        const matchCategory = r.category.toLowerCase().includes(q);
        if (!matchDesc && !matchAddress && !matchCategory) return false;
      }
      return true;
    });
  }, [reports, filters]);

  const handleOpenDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <InteractiveMap
        reports={filteredReports}
        onSelectReport={handleOpenDetails}
        onOpenFilters={() => setFilterModalVisible(true)}
      />

      <MapFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
      />

      <ReportDetailModal
        report={selectedReport}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
