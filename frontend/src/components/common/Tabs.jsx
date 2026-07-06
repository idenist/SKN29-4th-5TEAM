export default function Tabs({ tabs = [], activeValue, onChange, ariaLabel = '탭 메뉴', children }) {
  const activeTab = tabs.find((tab) => tab.value === activeValue);

  return (
    <div className="ui-tabs">
      <div className="ui-tab-list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const isActive = tab.value === activeValue;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              className={isActive ? 'ui-tab ui-tab-active' : 'ui-tab'}
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="ui-tab-panel" role="tabpanel">
        {children || activeTab?.content}
      </div>
    </div>
  );
}

// Example: <Tabs tabs={tabs} activeValue={tab} onChange={setTab} />
