import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyBookingStore,
  readBookingStore,
  writeBookingStore,
} from "@/lib/cinema/booking-store";
import type { BookingStore, Reservation } from "@/lib/cinema/types";

const reservation: Reservation = {
  id: "reservation-1",
  code: "C123456",
  screeningId: "screening-1",
  movieId: "movie-1",
  movieTitle: "라라랜드",
  screeningDate: "2026-09-29",
  startTime: "19:15",
  auditorium: "상영관 4",
  audienceCount: 2,
  seatIds: ["B3", "B4"],
  total: 28000,
  status: "booked",
  createdAt: "2026-09-29T00:00:00.000Z",
};

function withWindow(value: unknown, run: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
  });

  try {
    run();
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

function createMemoryStorage(initialValue?: string) {
  const values = new Map<string, string>();
  if (initialValue !== undefined) values.set("cinema-kiosk-bookings-v1", initialValue);

  return {
    values,
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("createEmptyBookingStore returns an empty version 1 store", () => {
  assert.deepEqual(createEmptyBookingStore(), { version: 1, reservations: [] });
});

test("readBookingStore returns an empty store during server rendering", () => {
  withWindow(undefined, () => {
    assert.deepEqual(readBookingStore(), createEmptyBookingStore());
  });
});

test("readBookingStore returns an empty store when no saved value exists", () => {
  const storage = createMemoryStorage();

  withWindow({ localStorage: storage }, () => {
    assert.deepEqual(readBookingStore(), createEmptyBookingStore());
  });
});

test("readBookingStore restores valid reservations written by writeBookingStore", () => {
  const storage = createMemoryStorage();
  const store: BookingStore = { version: 1, reservations: [reservation] };

  withWindow({ localStorage: storage }, () => {
    assert.equal(writeBookingStore(store), true);
    assert.deepEqual(readBookingStore(), store);
    assert.deepEqual(
      JSON.parse(storage.values.get("cinema-kiosk-bookings-v1") ?? "null"),
      store,
    );
  });
});

test("readBookingStore falls back to empty for malformed JSON", () => {
  const storage = createMemoryStorage("{not-json");

  withWindow({ localStorage: storage }, () => {
    assert.deepEqual(readBookingStore(), createEmptyBookingStore());
  });
});

test("readBookingStore rejects unsupported versions and invalid store shapes", () => {
  const invalidValues = [
    { version: 2, reservations: [reservation] },
    { version: 1, reservations: {} },
    { version: 1, reservations: [{ ...reservation, audienceCount: "2" }] },
    { version: 1, reservations: [{ ...reservation, status: "pending" }] },
  ];

  for (const value of invalidValues) {
    const storage = createMemoryStorage(JSON.stringify(value));
    withWindow({ localStorage: storage }, () => {
      assert.deepEqual(readBookingStore(), createEmptyBookingStore());
    });
  }
});

test("readBookingStore handles missing storage and read exceptions", () => {
  withWindow({}, () => {
    assert.deepEqual(readBookingStore(), createEmptyBookingStore());
  });

  withWindow(
    {
      localStorage: {
        get getItem() {
          throw new Error("storage access denied");
        },
      },
    },
    () => {
      assert.deepEqual(readBookingStore(), createEmptyBookingStore());
    },
  );

  withWindow(
    {
      get localStorage() {
        throw new Error("storage is disabled");
      },
    },
    () => {
      assert.deepEqual(readBookingStore(), createEmptyBookingStore());
    },
  );
});

test("writeBookingStore returns false during server rendering or when storage is unavailable", () => {
  withWindow(undefined, () => {
    assert.equal(writeBookingStore(createEmptyBookingStore()), false);
  });

  withWindow({}, () => {
    assert.equal(writeBookingStore(createEmptyBookingStore()), false);
  });
});

test("writeBookingStore returns false when browser storage throws", () => {
  withWindow(
    {
      localStorage: {
        setItem() {
          throw new Error("quota exceeded");
        },
      },
    },
    () => {
      assert.equal(writeBookingStore(createEmptyBookingStore()), false);
    },
  );

  withWindow(
    {
      get localStorage() {
        throw new Error("storage is disabled");
      },
    },
    () => {
      assert.equal(writeBookingStore(createEmptyBookingStore()), false);
    },
  );
});
