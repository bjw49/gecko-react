import React, { Component } from 'react';
import styles from './styles.module.css';
import NetworkKey from 'components/Generic/NetworkKey';
import ThresholdSlider from 'components/Generic/ThresholdSlider';
import ForceNetwork from 'components/Generic/ForceNetwork';

export class NetworkView extends Component {
  render() {
    const { onSwitch, onThreshold, data, sizeMetric, onSelect } = this.props;
    return (
      <div className={styles['network-panel']}>
        <NetworkKey onSwitch={onSwitch} />
        <ThresholdSlider threshold={onThreshold} />
        <ForceNetwork data={data} sizeMetric={sizeMetric} onSelect={onSelect} />
      </div>
    );
  }
}
