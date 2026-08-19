import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  REPORT_CATEGORIES,
  ReportCategory,
  ReportStatus,
  PriorityLevel,
  TRANSLATIONS,
} from '../../types';
import { useCivicStore } from '../../lib/store';

interface MapFilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MapFilterModal: React.FC<MapFilterModalProps> = ({
  visible,
  onClose,
}) => {
  const { filters, setFilters, resetFilters, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const STATUSES: { id: ReportStatus; label: string }[] = [
    { id: 'submitted', label: lang === 'EL' ? 'Υποβλήθηκε' : 'Submitted' },
    { id: 'acknowledged', label: lang === 'EL' ? 'Παραλήφθηκε' : 'Acknowledged' },
    { id: 'in_progress', label: lang === 'EL' ? 'Σε Εξέλιξη' : 'In Progress' },
    { id: 'resolved', label: lang === 'EL' ? 'Επιλύθηκε' : 'Resolved' },
  ];

  const PRIORITIES: { id: PriorityLevel; label: string }[] = [
    { id: 'high', label: lang === 'EL' ? 'Υψηλή Προτεραιότητα' : 'High Priority' },
    { id: 'medium', label: lang === 'EL' ? 'Μεσαία Προτεραιότητα' : 'Medium Priority' },
    { id: 'low', label: lang === 'EL' ? 'Χαμηλή Προτεραιότητα' : 'Low Priority' },
  ];

  const [localCategories, setLocalCategories] = useState<ReportCategory[]>(
    filters.categories
  );
  const [localStatuses, setLocalStatuses] = useState<ReportStatus[]>(
    filters.statuses
  );
  const [localPriorities, setLocalPriorities] = useState<PriorityLevel[]>(
    filters.priorities
  );
  const [search, setSearch] = useState(filters.searchQuery);

  const toggleCategory = (cat: ReportCategory) => {
    if (localCategories.includes(cat)) {
      setLocalCategories(localCategories.filter((c) => c !== cat));
    } else {
      setLocalCategories([...localCategories, cat]);
    }
  };

  const toggleStatus = (st: ReportStatus) => {
    if (localStatuses.includes(st)) {
      setLocalStatuses(localStatuses.filter((s) => s !== st));
    } else {
      setLocalStatuses([...localStatuses, st]);
    }
  };

  const togglePriority = (pr: PriorityLevel) => {
    if (localPriorities.includes(pr)) {
      setLocalPriorities(localPriorities.filter((p) => p !== pr));
    } else {
      setLocalPriorities([...localPriorities, pr]);
    }
  };

  const handleApply = () => {
    setFilters({
      categories: localCategories,
      statuses: localStatuses,
      priorities: localPriorities,
      searchQuery: search,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalCategories([]);
    setLocalStatuses([]);
    setLocalPriorities([]);
    setSearch('');
    resetFilters();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
          {/* Header */}
          <View style={[styles.header, isDark && styles.headerDark]}>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>{t.filterSearch}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#0f172a'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Keyword Search */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {lang === 'EL' ? 'Αναζήτηση με Λέξη-Κλειδί' : 'Search Keyword'}
            </Text>
            <View style={[styles.searchWrapper, isDark && styles.searchWrapperDark]}>
              <Ionicons name="search-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.searchInput, isDark && styles.textDark]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Categories Grid */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t.selectCategory}</Text>
            <View style={styles.chipsContainer}>
              {REPORT_CATEGORIES.map((cat) => {
                const active = localCategories.includes(cat.id);
                const catLabel = lang === 'EL' ? cat.labelEl : cat.label;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isDark && styles.chipDark,
                      active && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.iconName as any}
                      size={16}
                      color={active ? '#ffffff' : isDark ? '#94a3b8' : cat.color}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isDark && styles.subTextDark,
                        active && { color: '#ffffff', fontWeight: '700' },
                      ]}
                    >
                      {catLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Statuses */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {lang === 'EL' ? 'Κατάσταση Αναφοράς' : 'Report Status'}
            </Text>
            <View style={styles.chipsContainer}>
              {STATUSES.map((st) => {
                const active = localStatuses.includes(st.id);
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[
                      styles.chip,
                      isDark && styles.chipDark,
                      active && styles.chipActiveBlue,
                    ]}
                    onPress={() => toggleStatus(st.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isDark && styles.subTextDark,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{t.priority}</Text>
            <View style={styles.chipsContainer}>
              {PRIORITIES.map((pr) => {
                const active = localPriorities.includes(pr.id);
                return (
                  <TouchableOpacity
                    key={pr.id}
                    style={[
                      styles.chip,
                      isDark && styles.chipDark,
                      active && styles.chipActiveBlue,
                    ]}
                    onPress={() => togglePriority(pr.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isDark && styles.subTextDark,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {pr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={[styles.footer, isDark && styles.footerDark]}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>{lang === 'EL' ? 'Επαναφορά' : 'Reset All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>{lang === 'EL' ? 'Εφαρμογή' : 'Apply Filters'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalCardDark: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#cbd5e1',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchWrapperDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  chipActiveBlue: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  footerDark: {
    borderTopColor: '#334155',
  },
  resetBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
