import {Box3, Frustum, Sphere, Vector3} from "three";

class Node {
  /**
   * @type {Box3}
   */
  aabb;

  /**
   * @type {number}
   */
  lodLevel;

  constructor(aabb) {
    this.aabb = aabb;
  }

  /**
   * Quadrants of node. Assumes XZ plane.
   * @returns {Node[]}
   */
  get children() {
    return [
      new Node(new Box3(
        new Vector3(this.aabb.min.x, this.aabb.min.y, this.aabb.getCenter(new Vector3()).z),
        new Vector3(this.aabb.getCenter(new Vector3()).x, this.aabb.max.y, this.aabb.max.z)
      )),
      new Node(
        new Box3(this.aabb.getCenter(new Vector3()), this.aabb.max)
      ),
      new Node(
        new Box3(this.aabb.min, this.aabb.getCenter(new Vector3()))
      ),
      new Node(
        new Box3(
          new Vector3(this.aabb.getCenter(new Vector3()).x, this.aabb.min.y, this.aabb.min.z),
          new Vector3(this.aabb.max.x, this.aabb.max.y, this.aabb.getCenter(new Vector3()).z)
        )
      )
    ]
  }
}

export class Quadtree {

  lodRanges;
  /**
   * @type {[Node]}
   */
  nodes = [];
  cameraPosition;
  frustum;

  /**
   * @param {Box3} root
   * @param {[number]} lodRanges
   * @param {Frustum} frustum
   * @param {Vector3} observer
   */
  constructor(root, lodRanges, frustum, observer) {
    this.lodRanges = lodRanges;
    this.cameraPosition = observer.clone();
    this.frustum = frustum;
    this.selectLods(new Node(root), lodRanges.length - 1);
  }

  selectLods(node, lodLevel) {
    node.lodLevel = lodLevel
    if (!node.aabb.intersectsSphere(new Sphere(this.cameraPosition, this.lodRanges[lodLevel]))) {
      return false;
    }

    if (!this.frustum.intersectsBox(node.aabb)) {
      return true;
    }

    if (lodLevel === 0) {
      // add whole node
      // 4 children at 1/2 resolution = 1 full resolution node
      const children = node.children;
      children.forEach((child) => {
        child.lodLevel = lodLevel
        this.nodes.push(child)
      })
      return true;
    } else {
      if (!node.aabb.intersectsSphere(new Sphere(this.cameraPosition, this.lodRanges[lodLevel - 1]))) {
        // add whole node
        // 4 children at 1/2 resolution = 1 full resolution node
        const children = node.children;
        children.forEach((child) => {
          child.lodLevel = lodLevel
          this.nodes.push(child)
        })
      } else {
        node.children.forEach(child => {
          if (!this.selectLods(child, lodLevel - 1)) {
            // use lod level of parent since this child wasn't selected at lower LOD
            child.lodLevel = lodLevel
            // add partial node
            this.nodes.push(child)
          }
        })
      }
    }
    return true;
  }
}