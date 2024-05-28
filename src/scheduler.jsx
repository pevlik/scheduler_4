import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
    Button, Datepicker, Eventcalendar, Input, Popup, setOptions, Snackbar, Switch, Textarea, localeRu 
} from "@mobiscroll/react";
import './create-read-update-delete-CRUD.css';
import { addEvent, getEvents, updateEvent, deleteEvent } from './firebase'; // импорт функций Firestore

setOptions({
    themeVariant: 'light',
    locale: localeRu,
    timeFormat: 'HH:mm'
});

const colors = ['#ffeb3c', '#ff9900', '#f44437', '#ea1e63', '#9c26b0', '#3f51b5', '', '#009788', '#4baf4f', '#7e5d4e'];

function App() {
    const [myEvents, setMyEvents] = useState([]);
    const [tempEvent, setTempEvent] = useState(null);
    const [undoEvent, setUndoEvent] = useState(null);
    const [isOpen, setOpen] = useState(false);
    const [isEdit, setEdit] = useState(false);
    const [anchor, setAnchor] = useState(null);
    const [start, startRef] = useState(null);
    const [end, endRef] = useState(null);
    const [popupEventTitle, setTitle] = useState('');
    const [popupEventDescription, setDescription] = useState('');
    const [popupEventAllDay, setAllDay] = useState(true);
    const [popupEventDate, setDate] = useState([]);
    const [popupEventStatus, setStatus] = useState('busy');
    const [mySelectedDate, setSelectedDate] = useState(new Date());
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [colorAnchor, setColorAnchor] = useState(null);
    const [selectedColor, setSelectedColor] = useState('');
    const [tempColor, setTempColor] = useState('');
    const [isSnackbarOpen, setSnackbarOpen] = useState(false);

    const colorPicker = useRef();

    const myView = useMemo(() => ({ 
        schedule: { 
            type: 'week',
            startTime: '06:00',
            endTime: '24:00'
        } 
    }), []);

    const colorButtons = useMemo(() => [
        'cancel',
        {
            handler: () => {
                setSelectedColor(tempColor);
                setColorPickerOpen(false);
            },
            keyCode: 'enter',
            text: 'Save',
            cssClass: 'mbsc-popup-button-primary',
        },
    ], [tempColor]);

    const colorResponsive = useMemo(() => ({
        medium: {
            display: 'anchored',
            touchUi: false,
            buttons: [],
        },
    }), []);

    const snackbarButton = useMemo(() => ({
        action: () => {
            setMyEvents((prevEvents) => [...prevEvents, undoEvent]);
        },
        text: 'Отменить',
    }), [undoEvent]);

    const handleSnackbarClose = useCallback(() => {
        setSnackbarOpen(false);
    }, []);

    const saveEvent = useCallback(async () => {
        const newEvent = {
            title: popupEventTitle,
            description: popupEventDescription,
            start: new Date(popupEventDate[0]),
            end: new Date(popupEventDate[1]),
            allDay: popupEventAllDay,
            status: popupEventStatus,
            color: selectedColor,
        };
        if (isEdit) {
            const index = myEvents.findIndex((x) => x.id === tempEvent.id);
            const newEventList = [...myEvents];
            newEventList.splice(index, 1, newEvent);
            setMyEvents(newEventList);
            await updateEvent(tempEvent.id, newEvent); // Обновить событие в Firestore
        } else {
            const id = await addEvent(newEvent); // Добавить новое событие в Firestore
            setMyEvents([...myEvents, { id, ...newEvent }]);
        }
        setSelectedDate(popupEventDate[0]);
        setOpen(false);
    }, [
        isEdit, myEvents, popupEventAllDay, popupEventDate, popupEventDescription,
        popupEventStatus, popupEventTitle, tempEvent, selectedColor
    ]);

    const deleteEventById = useCallback(async (id) => {
        await deleteEvent(id); // Удалить событие из Firestore
        setMyEvents(myEvents.filter((item) => item.id !== id));
        setUndoEvent(myEvents.find((item) => item.id === id));
        setTimeout(() => {
            setSnackbarOpen(true);
        });
    }, [myEvents]);

    const loadPopupForm = useCallback((event) => {
        setTitle(event.title);
        setDescription(event.description);
        setDate([new Date(event.start), new Date(event.end)]);
        setAllDay(event.allDay || false);
        setStatus(event.status || 'busy');
        setSelectedColor(event.color || '');
    }, []);

    const titleChange = useCallback((ev) => {
        setTitle(ev.target.value);
    }, []);

    const descriptionChange = useCallback((ev) => {
        setDescription(ev.target.value);
    }, []);

    const allDayChange = useCallback((ev) => {
        setAllDay(ev.target.checked);
    }, []);

    const dateChange = useCallback((args) => {
        setDate(args.value);
    }, []);

    // const statusChange = useCallback((ev) => {
    //     setStatus(ev.target.value);
    // }, []);

    const onDeleteClick = useCallback(() => {
        deleteEventById(tempEvent.id);
        setOpen(false);
    }, [deleteEventById, tempEvent]);

    const onSelectedDateChange = useCallback((event) => {
        setSelectedDate(event.date);
    }, []);

    const onEventClick = useCallback((args) => {
        setEdit(true);
        setTempEvent({ ...args.event });
        loadPopupForm(args.event);
        setAnchor(args.domEvent.target);
        setOpen(true);
    }, [loadPopupForm]);

    const onEventCreated = useCallback((args) => {
        setEdit(false);
        setTempEvent(args.event);
        loadPopupForm(args.event);
        setAnchor(args.target);
        setOpen(true);
    }, [loadPopupForm]);

    const onEventDeleted = useCallback((args) => {
        deleteEventById(args.event.id);
    }, [deleteEventById]);

    const onEventUpdated = useCallback(async (args) => {
        await updateEvent(args.event.id, args.event); // Обновить событие в Firestore после перетаскивания или изменения размера
    }, []);

    const controls = useMemo(() => (popupEventAllDay ? ['date'] : ['datetime']), [popupEventAllDay]);
    const datepickerResponsive = useMemo(() => popupEventAllDay ? {
        medium: {
            controls: ['calendar'],
            touchUi: false,
        },
    } : {
        medium: {
            controls: ['calendar', 'time'],
            touchUi: false,
        },
    }, [popupEventAllDay]);

    const headerText = useMemo(() => (isEdit ? 'Edit event' : 'Новое событие'), [isEdit]);
    const popupButtons = useMemo(() => {
        if (isEdit) {
            return [
                'cancel',
                {
                    handler: () => {
                        saveEvent();
                    },
                    keyCode: 'enter',
                    text: 'Сохранить',
                    cssClass: 'mbsc-popup-button-primary',
                },
            ];
        } else {
            return [
                'cancel',
                {
                    handler: () => {
                        saveEvent();
                    },
                    keyCode: 'enter',
                    text: 'Сохранить',
                    cssClass: 'mbsc-popup-button-primary',
                },
            ];
        }
    }, [isEdit, saveEvent]);

    const popupResponsive = useMemo(() => ({
        medium: {
            display: 'anchored',
            width: 400,
            fullScreen: false,
            touchUi: false,
        },
    }), []);

    const onClose = useCallback(() => {
        if (!isEdit) {
            setMyEvents([...myEvents]);
        }
        setOpen(false);
    }, [isEdit, myEvents]);

    const selectColor = useCallback((color) => {
        setTempColor(color);
    }, []);

    const openColorPicker = useCallback((ev) => {
        selectColor(selectedColor || '');
        setColorAnchor(ev.currentTarget);
        setColorPickerOpen(true);
    }, [selectColor, selectedColor]);

    const changeColor = useCallback((ev) => {
        const color = ev.currentTarget.getAttribute('data-value');
        selectColor(color);
        if (!colorPicker.current.s.buttons.length) {
            setSelectedColor(color);
            setColorPickerOpen(false);
        }
    }, [selectColor, setSelectedColor]);

    useEffect(() => {
        const fetchEvents = async () => {
            const events = await getEvents();
            setMyEvents(events);
        };
        fetchEvents();
    }, []);

    return (
        <div>
            <Eventcalendar
                locale={localeRu}
                view={myView}
                data={myEvents}
                clickToCreate="double"
                dragToCreate={true}
                // dragToMove={true}
                dragToResize={true}
                selectedDate={mySelectedDate}
                onSelectedDateChange={onSelectedDateChange}
                onEventClick={onEventClick}
                onEventCreated={onEventCreated}
                onEventDeleted={onEventDeleted}
                onEventUpdated={onEventUpdated}
                
            />
            <Popup
                display="bottom"
                fullScreen={true}
                contentPadding={false}
                headerText={headerText}
                anchor={anchor}
                buttons={popupButtons}
                isOpen={isOpen}
                onClose={onClose}
                responsive={popupResponsive}
            >
                <div className="mbsc-form-group">
                    <Input label="Событие" value={popupEventTitle} onChange={titleChange} />
                    <Textarea label="Описание" value={popupEventDescription} onChange={descriptionChange} />
                </div>
                <div className="mbsc-form-group">
                    <Switch label="Весь день" checked={popupEventAllDay} onChange={allDayChange} />
                    <Input ref={startRef} label="Начало" />
                    <Input ref={endRef} label="Конец" />
                    <Datepicker
                        select="range"
                        controls={controls}
                        touchUi={true}
                        startInput={start}
                        endInput={end}
                        showRangeLabels={false}
                        responsive={datepickerResponsive}
                        onChange={dateChange}
                        value={popupEventDate}
                    />
                    <div onClick={openColorPicker} className="event-color-c">
                        <div className="event-color-label">Цвет события</div>
                        <div className="event-color" style={{ background: selectedColor }}></div>
                    </div>
                    {/* <SegmentedGroup onChange={statusChange}>
                        <Segmented value="busy" checked={popupEventStatus === 'busy'}>
                            Show as busy
                        </Segmented>
                        <Segmented value="free" checked={popupEventStatus === 'free'}>
                            Show as free
                        </Segmented>
                    </SegmentedGroup> */}
                    {isEdit && (
                        <div className="mbsc-button-group">
                            <Button className="mbsc-button-block" color="danger" variant="outline" onClick={onDeleteClick}>
                                Удалить событие
                            </Button>
                        </div>
                    )}
                </div>
            </Popup>
            <Popup
                display="bottom"
                contentPadding={false}
                showArrow={false}
                showOverlay={false}
                anchor={colorAnchor}
                isOpen={colorPickerOpen}
                buttons={colorButtons}
                responsive={colorResponsive}
                ref={colorPicker}
            >
                <div className="crud-color-row">
                    {colors.map((color, index) => {
                        if (index < 5) {
                            return (
                                <div
                                    key={index}
                                    onClick={changeColor}
                                    className={'crud-color-c ' + (tempColor === color ? 'selected' : '')}
                                    data-value={color}
                                >
                                    <div className="crud-color mbsc-icon mbsc-font-icon mbsc-icon-material-check" style={{ background: color }}></div>
                                </div>
                            );
                        } else return null;
                    })}
                </div>
                <div className="crud-color-row">
                    {colors.map((color, index) => {
                        if (index >= 5) {
                            return (
                                <div
                                    key={index}
                                    onClick={changeColor}
                                    className={'crud-color-c ' + (tempColor === color ? 'selected' : '')}
                                    data-value={color}
                                >
                                    <div className="crud-color mbsc-icon mbsc-font-icon mbsc-icon-material-check" style={{ background: color }}></div>
                                </div>
                            );
                        } else return null;
                    })}
                </div>
            </Popup>
            <Snackbar isOpen={isSnackbarOpen} message="Событие удалено" button={snackbarButton} onClose={handleSnackbarClose} />
        </div>
    );
}

export default App;
