"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./benzel.module.css";

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.closeIcon}>
      <path d="M6 6h12M6 6v12" />
    </svg>
  );
}

export default function BenzelReader({ pages }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [exitingPage, setExitingPage] = useState(null);
  const [turnDirection, setTurnDirection] = useState("next");
  const touchStartRef = useRef(null);
  const turnTimerRef = useRef(null);

  const currentPage = pages[pageIndex];
  const pageRatio = currentPage.width / currentPage.height;
  const atStart = pageIndex === 0;
  const atEnd = pageIndex === pages.length - 1;

  const goToPage = useCallback(
    (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === pageIndex) {
        return;
      }

      window.clearTimeout(turnTimerRef.current);
      setTurnDirection(nextIndex > pageIndex ? "next" : "previous");
      setExitingPage(pages[pageIndex]);
      setPageIndex(nextIndex);
      turnTimerRef.current = window.setTimeout(() => {
        setExitingPage(null);
      }, 620);
    },
    [pageIndex, pages]
  );

  const nextPage = useCallback(() => goToPage(pageIndex + 1), [goToPage, pageIndex]);
  const previousPage = useCallback(
    () => goToPage(pageIndex - 1),
    [goToPage, pageIndex]
  );

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(turnTimerRef.current);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        nextPage();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousPage();
      }
      if (event.key === "Home") {
        event.preventDefault();
        goToPage(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goToPage(pages.length - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToPage, nextPage, pages.length, previousPage]);

  const onPointerDown = (event) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const onPointerUp = (event) => {
    if (!touchStartRef.current) return;
    const deltaX = event.clientX - touchStartRef.current.x;
    const deltaY = event.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
      return;
    }

    if (deltaX < 0) nextPage();
    if (deltaX > 0) previousPage();
  };

  return (
    <main className={styles.reader} aria-label="Benzel comic reader">
      <div className={styles.skyTexture} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link href="/apps" className={styles.backLink} aria-label="Back to apps">
          <CloseIcon />
          <span>Apps</span>
        </Link>
        <div className={styles.titleLockup}>
          <h1>Benzel</h1>
          <p>The Night the Fun Went Missing</p>
        </div>
        <div className={styles.pageMeter} aria-live="polite">
          {pageIndex + 1}/{pages.length}
        </div>
      </header>

      <section
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        aria-label={`${currentPage.label} of ${pages.length}`}
      >
        <button
          type="button"
          className={`${styles.hitZone} ${styles.hitZoneLeft}`}
          onClick={previousPage}
          disabled={atStart}
          aria-label="Previous page"
        />
        <button
          type="button"
          className={`${styles.hitZone} ${styles.hitZoneRight}`}
          onClick={nextPage}
          disabled={atEnd}
          aria-label="Next page"
        />

        <div
          className={styles.book}
          style={{
            "--page-ratio": pageRatio,
          }}
        >
          <div className={styles.pageFrame}>
            <Image
              key={currentPage.id}
              src={currentPage.src}
              alt={`${currentPage.label} of Benzel: The Night the Fun Went Missing`}
              fill
              priority={pageIndex <= 1}
              sizes="(max-width: 700px) 100vw, 760px"
              className={styles.pageImage}
            />

            {exitingPage ? (
              <div
                key={`${exitingPage.id}-${turnDirection}`}
                className={`${styles.turnSheet} ${
                  turnDirection === "next"
                    ? styles.turnSheetNext
                    : styles.turnSheetPrevious
                }`}
                aria-hidden="true"
              >
                <Image
                  src={exitingPage.src}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 100vw, 760px"
                  className={styles.pageImage}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <footer className={styles.controls} aria-label="Comic navigation">
        <button
          type="button"
          className={styles.turnButton}
          onClick={previousPage}
          disabled={atStart}
          aria-label="Previous page"
        >
          <ArrowLeftIcon />
        </button>

        <div className={styles.controlCenter}>
          <div className={styles.progressTrack} aria-hidden="true">
            <span
              style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
            />
          </div>
          <div className={styles.thumbnailRail} aria-label="Choose a page">
            {pages.map((page, index) => (
              <button
                type="button"
                key={page.id}
                className={`${styles.thumbnailButton} ${
                  index === pageIndex ? styles.thumbnailButtonActive : ""
                }`}
                onClick={() => goToPage(index)}
                aria-label={`Go to ${page.label}`}
                aria-current={index === pageIndex ? "page" : undefined}
                style={{
                  "--thumb-ratio": page.width / page.height,
                  "--thumb-width": `${Math.min(
                    40,
                    Math.max(27, 34 * (page.width / page.height) / 0.71)
                  )}px`,
                  "--thumb-width-wide": `${Math.min(
                    49,
                    Math.max(33, 42 * (page.width / page.height) / 0.71)
                  )}px`,
                }}
              >
                <span className={styles.thumbnailImage}>
                  <Image
                    src={page.src}
                    alt=""
                    fill
                    sizes="56px"
                    className={styles.pageImage}
                  />
                </span>
                <span>{page.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={styles.turnButton}
          onClick={nextPage}
          disabled={atEnd}
          aria-label="Next page"
        >
          <ArrowRightIcon />
        </button>
      </footer>
    </main>
  );
}
