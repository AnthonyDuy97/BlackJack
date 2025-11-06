import { Prefab } from 'cc';

export interface PopupButtonData {
    label: string;
    callback?: () => void;
    buttonPrefabOverride?: Prefab | null;
}